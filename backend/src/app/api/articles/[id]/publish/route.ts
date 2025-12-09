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

// 公開設定スキーマ
const publishSchema = z.object({
  action: z.enum(["publish", "unpublish", "schedule"]),
  scheduledAt: z.string().datetime().optional(), // action=scheduleの場合必須
});

// 記事公開ステータス変更
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, publishSchema);

      // 存在確認
      const existing = await prisma.article.findUnique({
        where: { id },
        select: { id: true, status: true, publishedAt: true },
      });

      if (!existing) {
        return ApiErrors.notFound("記事");
      }

      if (existing.status === ArticleStatus.DELETED) {
        return ApiErrors.badRequest("ゴミ箱内の記事は公開できません");
      }

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
            // publishedAtは保持（再公開時に使用）
          };
          break;

        case "schedule":
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

        default:
          return ApiErrors.badRequest("不正なアクションです");
      }

      const article = await prisma.article.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
        },
      });

      const messages = {
        publish: "記事を公開しました",
        unpublish: "記事を非公開にしました",
        schedule: "記事の予約公開を設定しました",
      };

      return successResponse({
        ...article,
        message: messages[data.action],
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
