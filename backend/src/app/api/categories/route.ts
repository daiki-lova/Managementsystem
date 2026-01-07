import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth } from "@/lib/auth";
import {
  successResponse,
  paginatedResponse,
  ApiErrors,
  errorResponse,
  parsePaginationParams,
  calculatePagination,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";
import { randomUUID } from "crypto";

// カテゴリ一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.categories.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const categories = await prisma.categories.findMany({
        skip,
        take,
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
        orderBy: { name: "asc" },
      });

      return paginatedResponse({
        items: categories,
        total,
        page,
        limit,
        totalPages,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get categories error:", error);
    return ApiErrors.internalError();
  }
}

// カテゴリ作成スキーマ
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: commonSchemas.slug,
  description: z.string().max(500).optional(),
  color: z.string().max(100).optional(), // HEXカラーまたはTailwindクラス名を受け入れる
});

// カテゴリ作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createCategorySchema);

      const category = await prisma.categories.create({
        data: {
          id: randomUUID(),
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
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "CATEGORY_CREATE",
        user.id,
        "category",
        category.id,
        { name: category.name }
      );

      return successResponse(category, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
