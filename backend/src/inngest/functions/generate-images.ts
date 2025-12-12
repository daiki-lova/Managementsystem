import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { MediaSource, ArticleImageType } from "@prisma/client";
import { uploadImage } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";

// 画像生成関数
export const generateImages = inngest.createFunction(
  {
    id: "generate-images",
    name: "Generate Article Images",
    retries: 2,
    onFailure: async ({ error, event }) => {
      const eventData = (event as { data?: { articleId?: string; jobId?: string } }).data;
      const articleId = eventData?.articleId;
      const jobId = eventData?.jobId;
      console.error("Image generation failed:", error?.message, "Article:", articleId);
      // ジョブがある場合はステータスを更新（画像生成は任意なのでFAILEDにはしない）
      try {
        if (jobId) {
          // ジョブは既にCOMPLETEDの可能性があるので、画像生成失敗は別途通知
          const job = await prisma.generation_jobs.findUnique({
            where: { id: jobId },
            select: { userId: true },
          });
          if (job) {
            await prisma.notifications.create({
              data: {
                id: randomUUID(),
                userId: job.userId,
                type: "SYSTEM",
                title: "画像生成に失敗しました",
                message: `画像の自動生成に失敗しました。手動でアップロードしてください。`,
                metadata: { articleId, jobId },
              },
            });
          }
        }
      } catch (e) {
        console.error("Failed to create notification:", e);
      }
    },
    cancelOn: [
      {
        event: "article/cancel-image-generation",
        match: "data.articleId",
      },
    ],
  },
  { event: "article/generate-images" },
  async ({ event, step }) => {
    const { articleId, jobId } = event.data;

    // 記事データを取得
    const article = await step.run("fetch-article", async () => {
      return prisma.articles.findUnique({
        where: { id: articleId },
        include: {
          categories: true,
        },
      });
    });

    if (!article) {
      throw new Error("Article not found");
    }

    // 設定を取得（暗号化されたAPIキーを復号）
    const settings = await step.run("fetch-settings", async () => {
      return getDecryptedSettings();
    });

    if (!settings?.openRouterApiKey) {
      console.log("OpenRouter API key not configured, skipping image generation");
      return { skipped: true };
    }

    // システムプロンプトを取得
    const systemPrompt = settings.imagePrompt || "ヨガやウェルネスに関連する、落ち着いた色調でプロフェッショナルな雰囲気の画像を生成してください。";

    // アイキャッチ画像を生成
    const thumbnailUrl = await step.run("generate-thumbnail", async () => {
      const userPrompt = `ブログ記事のアイキャッチ画像。タイトル: "${article.title}"。カテゴリ: ${article.categories.name}。`;
      return generateImage({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        apiKey: settings.openRouterApiKey!,
        model: settings.imageModel || "google/gemini-3-pro-image-preview",
      });
    });

    // サムネイルをDBに保存
    if (thumbnailUrl) {
      await step.run("save-thumbnail", async () => {
        const mediaAsset = await prisma.media_assets.create({
          data: {
            id: randomUUID(),
            url: thumbnailUrl,
            fileName: `thumbnail-${articleId}.png`,
            source: MediaSource.AI_GENERATED,
            showInLibrary: false, // AI生成画像はライブラリに表示しない
          },
        });

        await prisma.articles.update({
          where: { id: articleId },
          data: { thumbnailId: mediaAsset.id },
        });
      });
    }

    // 差し込み画像1を生成
    const insertedImage1Url = await step.run("generate-inserted-1", async () => {
      const userPrompt = `記事の本文中に挿入するイメージ画像。記事タイトル: "${article.title}"。記事序盤に配置。`;
      return generateImage({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        apiKey: settings.openRouterApiKey!,
        model: settings.imageModel || "google/gemini-3-pro-image-preview",
      });
    });

    if (insertedImage1Url) {
      await step.run("save-inserted-1", async () => {
        const mediaAsset = await prisma.media_assets.create({
          data: {
            id: randomUUID(),
            url: insertedImage1Url,
            fileName: `inserted1-${articleId}.png`,
            source: MediaSource.AI_GENERATED,
            showInLibrary: false,
          },
        });

        await prisma.article_images.create({
          data: {
            id: randomUUID(),
            articleId,
            mediaAssetId: mediaAsset.id,
            type: ArticleImageType.INSERTED_1,
            position: 1,
          },
        });
      });
    }

    // 差し込み画像2を生成
    const insertedImage2Url = await step.run("generate-inserted-2", async () => {
      const userPrompt = `記事の本文中に挿入するイメージ画像。記事タイトル: "${article.title}"。記事中盤に配置。明るく前向きな雰囲気。`;
      return generateImage({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        apiKey: settings.openRouterApiKey!,
        model: settings.imageModel || "google/gemini-3-pro-image-preview",
      });
    });

    if (insertedImage2Url) {
      await step.run("save-inserted-2", async () => {
        const mediaAsset = await prisma.media_assets.create({
          data: {
            id: randomUUID(),
            url: insertedImage2Url,
            fileName: `inserted2-${articleId}.png`,
            source: MediaSource.AI_GENERATED,
            showInLibrary: false,
          },
        });

        await prisma.article_images.create({
          data: {
            id: randomUUID(),
            articleId,
            mediaAssetId: mediaAsset.id,
            type: ArticleImageType.INSERTED_2,
            position: 2,
          },
        });
      });
    }

    return {
      articleId,
      thumbnailGenerated: !!thumbnailUrl,
      insertedImage1Generated: !!insertedImage1Url,
      insertedImage2Generated: !!insertedImage2Url,
    };
  }
);

// 画像生成
interface GenerateImageParams {
  prompt: string;
  apiKey: string;
  model: string;
}

async function generateImage(params: GenerateImageParams): Promise<string | null> {
  const { prompt, apiKey, model } = params;

  try {
    // OpenRouter経由で画像生成（chat completions APIを使用）
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
      },
      body: JSON.stringify({
        model: model || "google/gemini-2.5-flash-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation failed:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("Image API response:", JSON.stringify(data, null, 2));

    // OpenRouterはbase64エンコードされた画像をimages配列で返す
    // 形式はモデルによって異なる場合がある
    const imageData = data.choices?.[0]?.message?.images?.[0];

    if (!imageData) {
      console.error("No image data in response:", JSON.stringify(data));
      return null;
    }

    let imageBuffer: Buffer;

    // imageDataがオブジェクトの場合（複数の形式に対応）
    if (typeof imageData === "object" && imageData.b64_json) {
      // OpenAI形式: {b64_json: "..."}
      imageBuffer = Buffer.from(imageData.b64_json, "base64");
    } else if (typeof imageData === "object" && imageData.image_url?.url) {
      // Gemini/OpenRouter形式: {type: "image_url", image_url: {url: "data:image/png;base64,..."}}
      const dataUrl = imageData.image_url.url;
      const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else if (dataUrl.startsWith("http")) {
        // 外部URLの場合はダウンロード
        const imageResponse = await fetch(dataUrl);
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      } else {
        console.error("Unknown image_url format:", dataUrl.substring(0, 100));
        return null;
      }
    } else if (typeof imageData === "object" && imageData.url) {
      // URLが返された場合はダウンロード
      const imageResponse = await fetch(imageData.url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (typeof imageData === "string") {
      // 文字列の場合（data URLまたは純粋なbase64）
      const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else {
        // 純粋なbase64の場合
        imageBuffer = Buffer.from(imageData, "base64");
      }
    } else {
      console.error("Unknown image data format:", typeof imageData, JSON.stringify(imageData).substring(0, 200));
      return null;
    }

    const filePath = `generated/${Date.now()}-${randomUUID()}.png`;
    const { url } = await uploadImage(
      "MEDIA",
      filePath,
      imageBuffer,
      "image/png"
    );

    return url;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}
