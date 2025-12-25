import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { isAppError, handlePrismaError } from "@/lib/errors";
import { ArticleStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 記事復元（ゴミ箱から戻す）
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.articles.findUnique({
        where: { id },
        select: { id: true, status: true, categoryId: true },
      });

      if (!existing) {
        return ApiErrors.notFound("記事");
      }

      if (existing.status !== ArticleStatus.DELETED) {
        return ApiErrors.badRequest("この記事はゴミ箱にありません");
      }

      // 下書きとして復元
      const article = await prisma.articles.update({
        where: { id },
        data: {
          status: ArticleStatus.DRAFT,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      });

      // カテゴリの記事数を増やす
      await prisma.categories.update({
        where: { id: existing.categoryId },
        data: { articlesCount: { increment: 1 } },
      });

      return successResponse(article);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
