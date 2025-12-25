import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { deleteImage } from "@/lib/supabase";

// ゴミ箱記事の自動削除（7日経過後）
export const autoDeleteCron = inngest.createFunction(
  {
    id: "auto-delete-cron",
    name: "Auto Delete Trashed Articles",
    retries: 3,
    onFailure: async ({ error }) => {
      console.error("Auto delete cron failed:", error?.message);
    },
  },
  // Cron: UTC 03:00 = JST 12:00（毎日正午に実行）
  // 深夜帯を避けてユーザーへの影響を最小化
  { cron: "0 3 * * *" },
  async ({ step }) => {
    // 7日前の日時
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    // 削除対象の記事を取得
    const trashedArticles = await step.run(
      "fetch-trashed-articles",
      async () => {
        return prisma.articles.findMany({
          where: {
            status: ArticleStatus.DELETED,
            deletedAt: {
              lte: cutoffDate,
            },
          },
          include: {
            media_assets: true,
            article_images: {
              include: {
                media_assets: true,
              },
            },
          },
        });
      }
    );

    if (trashedArticles.length === 0) {
      return { deleted: 0 };
    }

    const deletedIds: string[] = [];

    for (const article of trashedArticles) {
      await step.run(`delete-article-${article.id}`, async () => {
        // 関連する画像を削除（AI生成画像のみ）
        const imagesToDelete = [
          ...(article.media_assets?.source === "AI_GENERATED"
            ? [article.media_assets]
            : []),
          ...article.article_images
            .filter((img) => img.media_assets.source === "AI_GENERATED")
            .map((img) => img.media_assets),
        ];

        for (const image of imagesToDelete) {
          try {
            // Supabase Storageから削除
            const urlParts = image.url.split("/");
            const filePath = urlParts.slice(-2).join("/"); // generated/filename.png
            await deleteImage("MEDIA", filePath);

            // MediaAssetレコード削除
            await prisma.media_assets.delete({
              where: { id: image.id },
            });
          } catch (error) {
            console.error(`Failed to delete image ${image.id}:`, error);
          }
        }

        // 記事を完全削除
        await prisma.articles.delete({
          where: { id: article.id },
        });

        deletedIds.push(article.id);
      });
    }

    return {
      deleted: deletedIds.length,
      articleIds: deletedIds,
    };
  }
);

// 単一記事の自動削除イベント
export const autoDeleteEvent = inngest.createFunction(
  {
    id: "auto-delete-event",
    name: "Auto Delete Single Article",
    retries: 3,
    onFailure: async ({ error, event }) => {
      const articleId = (event as { data?: { articleId?: string } }).data?.articleId;
      console.error("Auto delete event failed:", error?.message, "Article:", articleId);
    },
    cancelOn: [
      {
        // 記事が復元された場合、自動削除をキャンセル
        event: "article/cancel-auto-delete",
        match: "data.articleId",
      },
    ],
  },
  { event: "article/auto-delete" },
  async ({ event, step }) => {
    const { articleId } = event.data;

    // 7日後まで待機
    await step.sleep("wait-7-days", "7d");

    const article = await step.run("check-article", async () => {
      return prisma.articles.findUnique({
        where: { id: articleId },
        include: {
          media_assets: true,
          article_images: {
            include: {
              media_assets: true,
            },
          },
        },
      });
    });

    // 記事が存在しない、または復元されている場合はスキップ
    if (!article || article.status !== ArticleStatus.DELETED) {
      return { skipped: true, reason: "Article not in trash or already deleted" };
    }

    // 関連画像を削除
    await step.run("delete-images", async () => {
      const imagesToDelete = [
        ...(article.media_assets?.source === "AI_GENERATED"
          ? [article.media_assets]
          : []),
        ...article.article_images
          .filter((img) => img.media_assets.source === "AI_GENERATED")
          .map((img) => img.media_assets),
      ];

      for (const image of imagesToDelete) {
        try {
          const urlParts = image.url.split("/");
          const filePath = urlParts.slice(-2).join("/");
          await deleteImage("MEDIA", filePath);
          await prisma.media_assets.delete({ where: { id: image.id } });
        } catch (error) {
          console.error(`Failed to delete image ${image.id}:`, error);
        }
      }
    });

    // 記事を完全削除
    await step.run("delete-article", async () => {
      await prisma.articles.delete({
        where: { id: articleId },
      });
    });

    return { deleted: true, articleId };
  }
);
