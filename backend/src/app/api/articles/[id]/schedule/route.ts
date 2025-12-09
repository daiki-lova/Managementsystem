import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { ArticleStatus } from "@prisma/client";
import { z } from "zod";
import { isAppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// スケジュール設定スキーマ
const scheduleSchema = z.object({
  publishAt: z.string().datetime(), // ISO 8601形式
});

// POST /api/articles/:id/schedule - 予約投稿を設定
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const validated = await validateBody(request, scheduleSchema);

      const article = await prisma.article.findUnique({
        where: { id },
      });

      if (!article) {
        return ApiErrors.notFound("記事");
      }

      // 権限チェック（作成者またはオーナーのみ）
      if (article.createdById !== user.id && user.role !== "OWNER") {
        return ApiErrors.forbidden();
      }

      // 削除済み記事はスケジュール不可
      if (article.status === ArticleStatus.DELETED) {
        return errorResponse("BAD_REQUEST", "削除された記事は予約投稿できません", 400);
      }

      // 既に公開済みの記事はスケジュール不可
      if (article.status === ArticleStatus.PUBLISHED) {
        return errorResponse("BAD_REQUEST", "公開済みの記事は予約投稿できません", 400);
      }

      const publishAt = new Date(validated.publishAt);

      // 過去の日時は設定不可
      if (publishAt <= new Date()) {
        return errorResponse("BAD_REQUEST", "予約日時は現在より未来の日時を指定してください", 400);
      }

      // 記事を予約状態に更新
      const updated = await prisma.article.update({
        where: { id },
        data: {
          status: ArticleStatus.SCHEDULED,
          publishedAt: publishAt,
        },
      });

      // 予約公開イベントを発火
      await inngest.send({
        name: "article/scheduled-publish",
        data: { articleId: id },
      });

      // 通知を作成
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ARTICLE_SCHEDULED",
          title: "記事を予約投稿しました",
          message: `「${article.title}」が${publishAt.toLocaleString("ja-JP")}に公開されます`,
          metadata: { articleId: id, publishAt: publishAt.toISOString() },
        },
      });

      return successResponse({
        ...updated,
        message: "予約投稿を設定しました",
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Article schedule error:", error);
    return ApiErrors.internalError();
  }
}

// DELETE /api/articles/:id/schedule - 予約投稿を解除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const article = await prisma.article.findUnique({
        where: { id },
      });

      if (!article) {
        return ApiErrors.notFound("記事");
      }

      // 権限チェック（作成者またはオーナーのみ）
      if (article.createdById !== user.id && user.role !== "OWNER") {
        return ApiErrors.forbidden();
      }

      // 予約状態でない場合はエラー
      if (article.status !== ArticleStatus.SCHEDULED) {
        return errorResponse("BAD_REQUEST", "この記事は予約投稿されていません", 400);
      }

      // 記事を下書きに戻す
      const updated = await prisma.article.update({
        where: { id },
        data: {
          status: ArticleStatus.DRAFT,
          publishedAt: null,
        },
      });

      return successResponse({
        ...updated,
        message: "予約投稿を解除しました",
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Article unschedule error:", error);
    return ApiErrors.internalError();
  }
}
