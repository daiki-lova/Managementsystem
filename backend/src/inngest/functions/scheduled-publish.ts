import { inngest } from "../client";
import prisma from "@/lib/prisma";
import { ArticleStatus } from "@prisma/client";
import { randomUUID } from "crypto";

// 予約投稿チェック関数（毎分実行）
export const scheduledPublishCron = inngest.createFunction(
  {
    id: "scheduled-publish-cron",
    name: "Check Scheduled Articles",
    retries: 3,
    onFailure: async ({ error }) => {
      console.error("Scheduled publish cron failed:", error?.message);
    },
  },
  // Cron: 毎分実行（タイムゾーン無関係）
  // 予約時刻は UTC で保存、比較も UTC で行う
  { cron: "* * * * *" },
  async ({ step }) => {
    // 現在時刻
    const now = new Date();

    // 公開予定時刻を過ぎた予約記事を取得
    const scheduledArticles = await step.run(
      "fetch-scheduled-articles",
      async () => {
        return prisma.articles.findMany({
          where: {
            status: ArticleStatus.SCHEDULED,
            publishedAt: {
              lte: now,
            },
          },
          select: {
            id: true,
            title: true,
            createdById: true,
          },
        });
      }
    );

    if (scheduledArticles.length === 0) {
      return { published: 0 };
    }

    // 各記事を公開
    const publishedIds: string[] = [];

    for (const article of scheduledArticles) {
      await step.run(`publish-article-${article.id}`, async () => {
        await prisma.articles.update({
          where: { id: article.id },
          data: {
            status: ArticleStatus.PUBLISHED,
          },
        });

        // 通知を作成
        await prisma.notifications.create({
          data: {
            id: randomUUID(),
            userId: article.createdById,
            type: "ARTICLE_PUBLISHED",
            title: "記事が公開されました",
            message: `「${article.title}」が予約時刻に公開されました`,
            metadata: { articleId: article.id },
          },
        });

        publishedIds.push(article.id);
      });
    }

    return {
      published: publishedIds.length,
      articleIds: publishedIds,
    };
  }
);

// 単一記事の予約公開イベント（生成ジョブからの呼び出し用）
export const scheduledPublishEvent = inngest.createFunction(
  {
    id: "scheduled-publish-event",
    name: "Scheduled Publish Single Article",
    retries: 3,
    onFailure: async ({ error, event }) => {
      const articleId = (event as { data?: { articleId?: string } }).data?.articleId;
      console.error("Scheduled publish event failed:", error?.message, "Article:", articleId);
      // 公開失敗の通知を作成
      if (!articleId) return;
      try {
        const article = await prisma.articles.findUnique({
          where: { id: articleId },
          select: { createdById: true, title: true },
        });
        if (article) {
          await prisma.notifications.create({
            data: {
              id: randomUUID(),
              userId: article.createdById,
              type: "SYSTEM",
              title: "予約公開に失敗しました",
              message: `「${article.title}」の予約公開に失敗しました: ${error?.message || "Unknown error"}`,
              metadata: { articleId },
            },
          });
        }
      } catch (e) {
        console.error("Failed to create notification:", e);
      }
    },
    cancelOn: [
      {
        event: "article/cancel-scheduled-publish",
        match: "data.articleId",
      },
    ],
  },
  { event: "article/scheduled-publish" },
  async ({ event, step }) => {
    const { articleId } = event.data;

    const article = await step.run("fetch-article", async () => {
      return prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
          createdById: true,
        },
      });
    });

    if (!article) {
      throw new Error("Article not found");
    }

    // 既に公開済みならスキップ
    if (article.status === ArticleStatus.PUBLISHED) {
      return { skipped: true, reason: "Already published" };
    }

    // 予約時刻まで待機
    if (article.publishedAt && new Date(article.publishedAt) > new Date()) {
      await step.sleepUntil("wait-for-publish-time", new Date(article.publishedAt));
    }

    // 記事を公開
    await step.run("publish-article", async () => {
      await prisma.articles.update({
        where: { id: articleId },
        data: {
          status: ArticleStatus.PUBLISHED,
        },
      });

      // 通知を作成
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId: article.createdById,
          type: "ARTICLE_PUBLISHED",
          title: "記事が公開されました",
          message: `「${article.title}」が予約時刻に公開されました`,
          metadata: { articleId: article.id },
        },
      });
    });

    return { published: true, articleId };
  }
);
