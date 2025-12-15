import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { MediaSource, ArticleImageType, Prisma } from "@prisma/client";
import { uploadImage } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";

// image_jobの型定義（パイプラインから渡される）
interface ImageJob {
  slot: string;   // "cover", "inserted_1", "inserted_2", etc.
  prompt: string; // 画像生成プロンプト
  alt: string;    // alt属性
}

// 生成結果の型
interface GeneratedImage {
  slot: string;
  url: string;
  alt: string;
  mediaAssetId: string;
}

function getMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
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
    const { articleId, jobId, imageJobs } = event.data as {
      articleId: string;
      jobId: string;
      imageJobs?: ImageJob[];
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

    // 生成結果を格納
    const generatedImages: GeneratedImage[] = [];

    // ========================================
    // imageJobsベースの画像生成（パイプラインから渡された場合）
    // ========================================
    if (imageJobs && imageJobs.length > 0) {
      console.log(`[ImageGeneration] Processing ${imageJobs.length} image jobs from pipeline`);

      for (let i = 0; i < imageJobs.length; i++) {
        const job = imageJobs[i];
        const stepName = `generate-image-${job.slot}-${i}`;

        const imageUrl = await step.run(stepName, async () => {
          // パイプラインのプロンプトにシステムプロンプトを追加
          const fullPrompt = `${systemPrompt}\n\n${job.prompt}`;
          return generateImage({
            prompt: fullPrompt,
            apiKey: settings.openRouterApiKey!,
            model: settings.imageModel || "google/gemini-3-pro-image-preview",
          });
        });

        if (imageUrl) {
          const saveStepName = `save-image-${job.slot}-${i}`;
          const savedImage = await step.run(saveStepName, async () => {
            // media_assetを作成
            const mediaAsset = await prisma.media_assets.create({
              data: {
                id: randomUUID(),
                url: imageUrl,
                fileName: `${job.slot}-${articleId}.png`,
                altText: job.alt,
                source: MediaSource.AI_GENERATED,
                showInLibrary: true, // ライブラリで差し替え可能にする
              },
            });

            // スロットに応じた処理
            if (job.slot === "cover" || job.slot === "thumbnail") {
              // カバー/サムネイルは記事のthumbnailIdに設定
              await prisma.articles.update({
                where: { id: articleId },
                data: { thumbnailId: mediaAsset.id },
              });
            } else {
              // それ以外はarticle_imagesに追加
              // スロット名からArticleImageTypeを決定
              let imageType: ArticleImageType;
              if (job.slot === "inserted_1" || job.slot === "insert_1") {
                imageType = ArticleImageType.INSERTED_1;
              } else if (job.slot === "inserted_2" || job.slot === "insert_2") {
                imageType = ArticleImageType.INSERTED_2;
              } else {
                // その他のスロットはINSERTED_1として扱う（拡張性のため）
                imageType = ArticleImageType.INSERTED_1;
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
              slot: job.slot,
              url: imageUrl,
              alt: job.alt,
              mediaAssetId: mediaAsset.id,
            };
          });

          generatedImages.push(savedImage);
        }
      }

      // 記事のブロックを更新（imageブロックに実際のURLを設定）
      if (generatedImages.length > 0) {
        await step.run("update-article-blocks", async () => {
          const currentBlocks = article.blocks as { id: string; type: string; content: string; metadata?: Record<string, unknown>; src?: string; alt?: string }[];

          // 使用済み画像を追跡（重複適用を防止）
          const usedImageSlots = new Set<string>();

          // 各画像ブロックのsrcを更新
          const updatedBlocks = currentBlocks.map((block, blockIndex) => {
            if (block.type === "image") {
              // 1. metadata.slotでマッチング（優先）
              const blockSlot = getMetadataString(block.metadata, "slot") || "";
              let matchingImage = blockSlot
                ? generatedImages.find((img) => img.slot === blockSlot && !usedImageSlots.has(img.slot))
                : null;

              // 2. slotがない場合、altテキストの部分一致でマッチング
              const blockAlt =
                block.alt
                || getMetadataString(block.metadata, "alt")
                || getMetadataString(block.metadata, "altText");
              if (!matchingImage && blockAlt) {
                const blockAltLower = blockAlt.toLowerCase();
                matchingImage = generatedImages.find(
                  (img) => !usedImageSlots.has(img.slot) && img.alt.toLowerCase().includes(blockAltLower.slice(0, 10))
                );
              }

              // 3. それでもマッチしない場合、画像ブロックの出現順でマッチング
              if (!matchingImage) {
                const unusedImages = generatedImages.filter((img) => !usedImageSlots.has(img.slot));
                if (unusedImages.length > 0) {
                  matchingImage = unusedImages[0];
                  console.log(
                    `[ImageGeneration] Fallback matching: block[${blockIndex}] → ${matchingImage.slot} (by order)`
                  );
                }
              }

              if (matchingImage) {
                usedImageSlots.add(matchingImage.slot);
                return {
                  ...block,
                  src: matchingImage.url,
                  alt: matchingImage.alt || block.alt || "",
                  content: matchingImage.url, // contentにもURLを設定（フォールバック用）
                  metadata: {
                    ...block.metadata,
                    slot: matchingImage.slot, // slotを保持/追加
                  },
                };
              }
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
        totalJobs: imageJobs.length,
        generatedImages: generatedImages.map((img) => ({
          slot: img.slot,
          url: img.url,
        })),
      };
    }

    // ========================================
    // フォールバック: imageJobsがない場合は従来のロジック
    // ========================================
    console.log("[ImageGeneration] No imageJobs provided, using fallback generation");

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
            showInLibrary: true, // ライブラリで差し替え可能にする
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
            showInLibrary: true, // ライブラリで差し替え可能にする
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
            showInLibrary: true, // ライブラリで差し替え可能にする
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
