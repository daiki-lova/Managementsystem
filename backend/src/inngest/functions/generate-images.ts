import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { MediaSource, ArticleImageType, Prisma } from "@prisma/client";
import { uploadImage } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";
import { buildImagePrompt, replacePlaceholderWithImage } from "./pipeline/common/prompts";

// 画像プレースホルダーの型定義
interface ImagePlaceholder {
  position: string;
  context: string;
  altHint: string;
}

// 旧形式（後方互換用）
interface LegacyImageJob {
  slot: string;
  prompt: string;
  alt: string;
}

// 生成結果の型
interface GeneratedImage {
  position: string;
  url: string;
  alt: string;
  mediaAssetId: string;
}

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
      try {
        if (jobId) {
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
    const {
      articleId,
      jobId,
      // 新形式
      imagePlaceholders,
      articleTitle,
      categoryName,
      brandTone,
      // 旧形式（後方互換）
      imageJobs,
    } = event.data as {
      articleId: string;
      jobId: string;
      imagePlaceholders?: ImagePlaceholder[];
      articleTitle?: string;
      categoryName?: string;
      brandTone?: string;
      imageJobs?: LegacyImageJob[];
    };

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

    // 設定を取得
    const settings = await step.run("fetch-settings", async () => {
      return getDecryptedSettings();
    });

    // OpenRouter APIキーがあれば画像生成可能（Nano Banana経由）
    if (!settings?.openRouterApiKey) {
      console.log("OpenRouter API key not configured, skipping image generation");
      return { skipped: true, reason: "No OpenRouter API key" };
    }

    // 短いプロンプトでトークン制限を回避
    const systemPrompt = "Create a yoga illustration.";
    const generatedImages: GeneratedImage[] = [];

    // ========================================
    // 新形式: imagePlaceholdersベースの画像生成
    // ========================================
    if (imagePlaceholders && imagePlaceholders.length > 0) {
      console.log(`[ImageGeneration] Processing ${imagePlaceholders.length} image placeholders`);

      for (let i = 0; i < imagePlaceholders.length; i++) {
        const placeholder = imagePlaceholders[i];
        const stepName = `generate-image-${placeholder.position}-${i}`;

        const imageUrl = await step.run(stepName, async () => {
          // プロンプトを構築
          const prompt = buildImagePrompt({
            position: placeholder.position,
            context: placeholder.context,
            altHint: placeholder.altHint,
            articleTitle: articleTitle || article.title,
            categoryName: categoryName || article.categories.name,
            brandTone,
          });

          const fullPrompt = `${systemPrompt}\n\n${prompt}`;
          return generateImage({
            prompt: fullPrompt,
            openRouterApiKey: settings.openRouterApiKey || undefined,
          });
        });

        if (imageUrl) {
          const saveStepName = `save-image-${placeholder.position}-${i}`;
          const savedImage = await step.run(saveStepName, async () => {
            const mediaAsset = await prisma.media_assets.create({
              data: {
                id: randomUUID(),
                url: imageUrl,
                fileName: `${placeholder.position}-${articleId}.png`,
                altText: placeholder.altHint,
                source: MediaSource.AI_GENERATED,
                showInLibrary: true,
              },
            });

            // heroはサムネイルとして設定
            if (placeholder.position === "hero") {
              await prisma.articles.update({
                where: { id: articleId },
                data: { thumbnailId: mediaAsset.id },
              });
            }

            // article_imagesに追加
            let imageType: ArticleImageType = ArticleImageType.INSERTED_1;
            if (placeholder.position === "section_1") {
              imageType = ArticleImageType.INSERTED_1;
            } else if (placeholder.position === "section_2") {
              imageType = ArticleImageType.INSERTED_2;
            }

            await prisma.article_images.create({
              data: {
                id: randomUUID(),
                articleId,
                mediaAssetId: mediaAsset.id,
                type: imageType,
                position: i,
              },
            });

            return {
              position: placeholder.position,
              url: imageUrl,
              alt: placeholder.altHint,
              mediaAssetId: mediaAsset.id,
            };
          });

          generatedImages.push(savedImage);
        }
      }

      // 記事のHTMLを更新（プレースホルダーを実際の画像に置換）
      if (generatedImages.length > 0) {
        await step.run("update-article-html", async () => {
          const currentBlocks = article.blocks as { id: string; type: string; content: string }[];

          // HTMLブロックを探して更新
          const updatedBlocks = currentBlocks.map((block) => {
            if (block.type === "html") {
              let updatedHtml = block.content;

              // 各生成画像でプレースホルダーを置換
              for (const image of generatedImages) {
                updatedHtml = replacePlaceholderWithImage(
                  updatedHtml,
                  image.position,
                  image.url,
                  image.alt
                );
              }

              return { ...block, content: updatedHtml };
            }
            return block;
          });

          await prisma.articles.update({
            where: { id: articleId },
            data: {
              blocks: updatedBlocks as unknown as Prisma.InputJsonValue,
            },
          });
        });
      }

      return {
        articleId,
        generatedCount: generatedImages.length,
        totalPlaceholders: imagePlaceholders.length,
        generatedImages: generatedImages.map((img) => ({
          position: img.position,
          url: img.url,
        })),
      };
    }

    // ========================================
    // 旧形式: imageJobsベースの画像生成（後方互換）
    // ========================================
    if (imageJobs && imageJobs.length > 0) {
      console.log(`[ImageGeneration] Processing ${imageJobs.length} legacy image jobs`);

      for (let i = 0; i < imageJobs.length; i++) {
        const job = imageJobs[i];
        const stepName = `generate-image-${job.slot}-${i}`;

        const imageUrl = await step.run(stepName, async () => {
          const fullPrompt = `${systemPrompt}\n\n${job.prompt}`;
          return generateImage({
            prompt: fullPrompt,
            openRouterApiKey: settings.openRouterApiKey || undefined,
          });
        });

        if (imageUrl) {
          const saveStepName = `save-image-${job.slot}-${i}`;
          const savedImage = await step.run(saveStepName, async () => {
            const mediaAsset = await prisma.media_assets.create({
              data: {
                id: randomUUID(),
                url: imageUrl,
                fileName: `${job.slot}-${articleId}.png`,
                altText: job.alt,
                source: MediaSource.AI_GENERATED,
                showInLibrary: true,
              },
            });

            if (job.slot === "cover" || job.slot === "thumbnail") {
              await prisma.articles.update({
                where: { id: articleId },
                data: { thumbnailId: mediaAsset.id },
              });
            } else {
              let imageType: ArticleImageType = ArticleImageType.INSERTED_1;
              if (job.slot === "inserted_2" || job.slot === "insert_2") {
                imageType = ArticleImageType.INSERTED_2;
              }

              await prisma.article_images.create({
                data: {
                  id: randomUUID(),
                  articleId,
                  mediaAssetId: mediaAsset.id,
                  type: imageType,
                  position: i,
                },
              });
            }

            return {
              position: job.slot,
              url: imageUrl,
              alt: job.alt,
              mediaAssetId: mediaAsset.id,
            };
          });

          generatedImages.push(savedImage);
        }
      }

      return {
        articleId,
        generatedCount: generatedImages.length,
        totalJobs: imageJobs.length,
        generatedImages: generatedImages.map((img) => ({
          position: img.position,
          url: img.url,
        })),
      };
    }

    // ========================================
    // フォールバック: デフォルトの画像生成
    // ========================================
    console.log("[ImageGeneration] No image data provided, using fallback generation");

    const thumbnailUrl = await step.run("generate-thumbnail", async () => {
      const userPrompt = `ブログ記事のアイキャッチ画像。タイトル: "${article.title}"。カテゴリ: ${article.categories.name}。`;
      return generateImage({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        openRouterApiKey: settings.openRouterApiKey || undefined,
      });
    });

    if (thumbnailUrl) {
      await step.run("save-thumbnail", async () => {
        const mediaAsset = await prisma.media_assets.create({
          data: {
            id: randomUUID(),
            url: thumbnailUrl,
            fileName: `thumbnail-${articleId}.png`,
            source: MediaSource.AI_GENERATED,
            showInLibrary: true,
          },
        });

        await prisma.articles.update({
          where: { id: articleId },
          data: { thumbnailId: mediaAsset.id },
        });
      });
    }

    return {
      articleId,
      thumbnailGenerated: !!thumbnailUrl,
    };
  }
);

// 画像生成パラメータ
interface GenerateImageParams {
  prompt: string;
  openRouterApiKey?: string;  // OpenRouter API Key
}

// OpenRouter経由のNano Banana (Gemini 2.5 Flash Image Preview)
const NANO_BANANA_MODEL = "google/gemini-2.5-flash-image-preview";

/**
 * OpenRouter経由でNano Banana (Gemini) を使用して画像を生成
 * https://openrouter.ai/docs/guides/overview/multimodal/image-generation
 */
async function generateImageWithOpenRouter(prompt: string, apiKey: string): Promise<string | null> {
  try {
    console.log(`[NanoBanana] Generating image via OpenRouter: ${NANO_BANANA_MODEL}`);

    // 120秒のタイムアウト（画像生成は時間がかかる場合がある）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    // OpenRouter chat/completions エンドポイント
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        },
        body: JSON.stringify({
          model: NANO_BANANA_MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          // 画像生成を有効にする
          modalities: ["image", "text"],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[NanoBanana] OpenRouter API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("[NanoBanana] Response received from OpenRouter");

    // レスポンスから画像データを抽出
    const message = data.choices?.[0]?.message;
    if (!message) {
      console.error("[NanoBanana] No message in response");
      return null;
    }

    // OpenRouterの画像レスポンス形式: message.images または message.content内のbase64
    // 形式1: message.images配列
    if (message.images && message.images.length > 0) {
      const imageData = message.images[0];

      // 形式1a: オブジェクト形式 { type: "image_url", image_url: { url: "data:image/..." } }
      if (typeof imageData === "object" && imageData.image_url?.url) {
        const dataUrl = imageData.image_url.url;
        if (typeof dataUrl === "string" && dataUrl.startsWith("data:image")) {
          const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
            const base64Data = base64Match[2];
            const imageBuffer = Buffer.from(base64Data, "base64");

            const filePath = `generated/${Date.now()}-${randomUUID()}.${extension}`;
            const { url } = await uploadImage(
              "MEDIA",
              filePath,
              imageBuffer,
              `image/${base64Match[1]}`
            );

            console.log(`[NanoBanana] Image saved (object format): ${url}`);
            return url;
          }
        }
      }

      // 形式1b: 文字列形式 "data:image/png;base64,..."
      if (typeof imageData === "string" && imageData.startsWith("data:image")) {
        const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
        if (base64Match) {
          const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
          const base64Data = base64Match[2];
          const imageBuffer = Buffer.from(base64Data, "base64");

          // Supabaseにアップロード
          const filePath = `generated/${Date.now()}-${randomUUID()}.${extension}`;
          const { url } = await uploadImage(
            "MEDIA",
            filePath,
            imageBuffer,
            `image/${base64Match[1]}`
          );

          console.log(`[NanoBanana] Image saved (string format): ${url}`);
          return url;
        }
      }
    }

    // 形式2: contentがdata URL形式
    if (typeof message.content === "string" && message.content.startsWith("data:image")) {
      const base64Match = message.content.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64Data = base64Match[2];
        const imageBuffer = Buffer.from(base64Data, "base64");

        const filePath = `generated/${Date.now()}-${randomUUID()}.${extension}`;
        const { url } = await uploadImage(
          "MEDIA",
          filePath,
          imageBuffer,
          `image/${base64Match[1]}`
        );

        console.log(`[NanoBanana] Image saved: ${url}`);
        return url;
      }
    }

    // 形式3: content配列内にimage_url
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === "image_url" && part.image_url?.url) {
          const imageUrl = part.image_url.url;
          if (imageUrl.startsWith("data:image")) {
            const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
              const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
              const base64Data = base64Match[2];
              const imageBuffer = Buffer.from(base64Data, "base64");

              const filePath = `generated/${Date.now()}-${randomUUID()}.${extension}`;
              const { url } = await uploadImage(
                "MEDIA",
                filePath,
                imageBuffer,
                `image/${base64Match[1]}`
              );

              console.log(`[NanoBanana] Image saved: ${url}`);
              return url;
            }
          }
        }
      }
    }

    console.error("[NanoBanana] No image data found in response");
    console.log("[NanoBanana] Response structure:", JSON.stringify(data).substring(0, 1000));
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[NanoBanana] Request timed out");
    } else {
      console.error("[NanoBanana] Error:", error);
    }
    return null;
  }
}

/**
 * 画像を生成するメイン関数
 */
async function generateImage(params: GenerateImageParams): Promise<string | null> {
  const { prompt, openRouterApiKey } = params;

  // OpenRouter経由でNano Banana (Gemini) を使用
  if (openRouterApiKey) {
    console.log("[ImageGeneration] Using Nano Banana via OpenRouter");
    const result = await generateImageWithOpenRouter(prompt, openRouterApiKey);
    if (result) return result;
    console.log("[ImageGeneration] OpenRouter image generation failed");
  } else {
    console.log("[ImageGeneration] OpenRouter API Key not configured");
  }

  // APIキーがない場合はnullを返す
  console.log("[ImageGeneration] No image API available - please configure OpenRouter API key in settings");
  return null;
}
