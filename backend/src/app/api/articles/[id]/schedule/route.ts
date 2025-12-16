import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import { validateBody } from "@/lib/validation";
import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { ArticleStatus } from "@prisma/client";
import { z } from "zod";
import { isAppError } from "@/lib/errors";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// スケジュール設定スキーマ
const scheduleSchema = z.object({
  // Frontend expects `scheduledAt` + optimistic lock `version`.
  // Keep `publishAt` for backward compatibility.
  scheduledAt: z.string().datetime().optional(),
  publishAt: z.string().datetime().optional(),
  version: z.number().int().min(1).optional(),
});

// POST /api/articles/:id/schedule - 予約投稿を設定
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async (user) => {
      const validated = await validateBody(request, scheduleSchema);

      const article = await prisma.articles.findUnique({
        where: { id },
        select: { id: true, title: true, status: true, createdById: true, version: true },
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

      // Optimistic lock
      if (validated.version !== undefined && validated.version !== article.version) {
        return errorResponse(
          "CONFLICT",
          "この記事は他のユーザーによって更新されました。ページを再読み込みしてください。",
          409
        );
      }

      const scheduledAtRaw = validated.scheduledAt ?? validated.publishAt;
      if (!scheduledAtRaw) {
        return errorResponse("VALIDATION_ERROR", "予約日時が指定されていません", 400);
      }

      const scheduledAt = new Date(scheduledAtRaw);

      // 過去の日時は設定不可
      if (scheduledAt <= new Date()) {
        return errorResponse("BAD_REQUEST", "予約日時は現在より未来の日時を指定してください", 400);
      }

      // 記事を予約状態に更新
      const updated = await prisma.articles.update({
        where: { id },
        data: {
          status: ArticleStatus.SCHEDULED,
          // Existing scheduler uses `publishedAt` as the scheduled publish time.
          publishedAt: scheduledAt,
          version: { increment: 1 },
        },
        select: { id: true, status: true, publishedAt: true, version: true },
      });

      // 予約公開イベントを発火
      await inngest.send({
        name: "article/scheduled-publish",
        data: { articleId: id },
      });

      // 通知を作成
      await prisma.notifications.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          type: "ARTICLE_SCHEDULED",
          title: "記事を予約投稿しました",
          message: `「${article.title}」が${scheduledAt.toLocaleString("ja-JP")}に公開されます`,
          metadata: { articleId: id, scheduledAt: scheduledAt.toISOString() },
        },
      });

      return successResponse({
        id: updated.id,
        status: updated.status,
        scheduledAt: updated.publishedAt?.toISOString() ?? null,
        version: updated.version,
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
      const { searchParams } = new URL(request.url);
      const versionParam = searchParams.get("version");
      const requestedVersion = versionParam ? Number(versionParam) : undefined;

      const article = await prisma.articles.findUnique({
        where: { id },
        select: { id: true, status: true, createdById: true, version: true },
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

      if (
        requestedVersion !== undefined &&
        Number.isFinite(requestedVersion) &&
        requestedVersion !== article.version
      ) {
        return errorResponse(
          "CONFLICT",
          "この記事は他のユーザーによって更新されました。ページを再読み込みしてください。",
          409
        );
      }

      // 記事を下書きに戻す
      const updated = await prisma.articles.update({
        where: { id },
        data: {
          status: ArticleStatus.DRAFT,
          publishedAt: null,
          version: { increment: 1 },
        },
        select: { id: true, status: true, publishedAt: true, version: true },
      });

      return successResponse({
        id: updated.id,
        status: updated.status,
        scheduledAt: null,
        version: updated.version,
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
