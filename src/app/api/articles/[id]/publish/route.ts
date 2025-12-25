import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody } from "@/lib/validation";
import { isAppError, handlePrismaError } from "@/lib/errors";
import { ArticleStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Frontend expects { version }.
// Keep old shape for backward compatibility.
const publishSchema = z.union([
  z.object({ version: z.number().int().min(1) }),
  z.object({
    action: z.enum(["publish", "unpublish", "schedule"]),
    scheduledAt: z.string().datetime().optional(),
  }),
]);

// 記事公開ステータス変更
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, publishSchema);

      // 存在確認
      const existing = await prisma.articles.findUnique({
        where: { id },
        select: { id: true, status: true, publishedAt: true, version: true },
      });

      if (!existing) {
        return ApiErrors.notFound("記事");
      }

      if (existing.status === ArticleStatus.DELETED) {
        return ApiErrors.badRequest("ゴミ箱内の記事は公開できません");
      }

      // New: optimistic lock publish
      if ("version" in data) {
        if (data.version !== existing.version) {
          return errorResponse(
            "CONFLICT",
            "この記事は他のユーザーによって更新されました。ページを再読み込みしてください。",
            409
          );
        }

        const article = await prisma.articles.update({
          where: { id },
          data: {
            status: ArticleStatus.PUBLISHED,
            publishedAt: new Date(),
            version: { increment: 1 },
          },
          select: { id: true, status: true, publishedAt: true, version: true },
        });

        return successResponse({
          id: article.id,
          status: article.status,
          publishedAt: article.publishedAt?.toISOString() ?? null,
          version: article.version,
        });
      }

      // Old shape: keep behavior but fix to use scheduledAt column
      let updateData: {
        status: ArticleStatus;
        publishedAt?: Date | null;
      };

      switch (data.action) {
        case "publish":
          updateData = {
            status: ArticleStatus.PUBLISHED,
            publishedAt: existing.publishedAt || new Date(),
          };
          break;

        case "unpublish":
          updateData = {
            status: ArticleStatus.DRAFT,
          };
          break;

        case "schedule": {
          if (!data.scheduledAt) {
            return ApiErrors.badRequest("予約公開には日時が必要です");
          }
          const scheduledDate = new Date(data.scheduledAt);
          if (scheduledDate <= new Date()) {
            return ApiErrors.badRequest("予約日時は未来の日時を指定してください");
          }
          updateData = {
            status: ArticleStatus.SCHEDULED,
            publishedAt: scheduledDate,
          };
          break;
        }
      }

      const article = await prisma.articles.update({
        where: { id },
        data: updateData,
        select: { id: true, status: true, publishedAt: true, version: true },
      });

      return successResponse({
        id: article.id,
        status: article.status,
        publishedAt: article.publishedAt?.toISOString() ?? null,
        scheduledAt: null,
        version: article.version,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
