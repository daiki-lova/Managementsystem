import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// カテゴリ詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const category = await prisma.categories.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          color: true,
          articlesCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!category) {
        return ApiErrors.notFound("カテゴリ");
      }

      return successResponse(category);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get category error:", error);
    return ApiErrors.internalError();
  }
}

// カテゴリ更新スキーマ
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: commonSchemas.slug.optional(),
  description: z.string().max(500).optional().nullable(),
  color: commonSchemas.hexColor.optional().nullable(),
});

// カテゴリ更新（オーナーのみ）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await params;
      const data = await validateBody(request, updateCategorySchema);

      // 存在確認
      const existing = await prisma.categories.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("カテゴリ");
      }

      const category = await prisma.categories.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          color: data.color,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          color: true,
          articlesCount: true,
          updatedAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CATEGORY_UPDATE",
        user.id,
        "category",
        category.id,
        { name: category.name, changes: data }
      );

      return successResponse(category);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// カテゴリ削除（オーナーのみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.categories.findUnique({
        where: { id },
        include: { _count: { select: { articles: true } } },
      });

      if (!existing) {
        return ApiErrors.notFound("カテゴリ");
      }

      // 紐づく記事がある場合は削除不可
      if (existing._count.articles > 0) {
        return ApiErrors.badRequest(
          `このカテゴリには${existing._count.articles}件の記事が紐づいています。先に記事のカテゴリを変更してください。`
        );
      }

      await prisma.categories.delete({
        where: { id },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CATEGORY_DELETE",
        user.id,
        "category",
        id,
        { name: existing.name }
      );

      return successResponse({ message: "カテゴリを削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
