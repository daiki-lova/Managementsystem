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

    // アイキャッチ画像を生成
    const thumbnailUrl = await step.run("generate-thumbnail", async () => {
      return generateImage({
        prompt: `ヨガに関するブログ記事のアイキャッチ画像。タイトル: "${article.title}"。カテゴリ: ${article.categories.name}。落ち着いた色調、プロフェッショナルな雰囲気、テキストなし。`,
        apiKey: settings.openRouterApiKey!,
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
      return generateImage({
        prompt: `ヨガのポーズや瞑想のイメージ画像。記事: "${article.title}"。落ち着いた色調、自然な雰囲気。`,
        apiKey: settings.openRouterApiKey!,
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
      return generateImage({
        prompt: `ヨガの効果やリラクゼーションを表現するイメージ画像。記事: "${article.title}"。明るく前向きな雰囲気。`,
        apiKey: settings.openRouterApiKey!,
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
}

async function generateImage(params: GenerateImageParams): Promise<string | null> {
  const { prompt, apiKey } = params;

  try {
    // OpenRouter経由でDALL-E 3を使用
    const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
      },
      body: JSON.stringify({
        model: "openai/dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return null;
    }

    // 画像をダウンロードしてSupabase Storageにアップロード
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

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
