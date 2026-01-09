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
        include: {
          _count: {
            select: {
              articles: true, // 全記事数
            },
          },
        },
        orderBy: { name: "asc" },
      });

      // 公開済み記事数を別途取得
      const publishedCounts = await prisma.articles.groupBy({
        by: ['categoryId'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
      });
      const publishedCountMap = new Map(
        publishedCounts.map(p => [p.categoryId, p._count.id])
      );

      // 有効な記事数（ゴミ箱以外）を別途取得
      const activeCounts = await prisma.articles.groupBy({
        by: ['categoryId'],
        where: { status: { not: 'DELETED' } },
        _count: { id: true },
      });
      const activeCountMap = new Map(
        activeCounts.map(p => [p.categoryId, p._count.id])
      );

      // レスポンスを整形
      const formattedCategories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        articlesCount: activeCountMap.get(cat.id) || 0, // ゴミ箱を除いた記事数
        publishedCount: publishedCountMap.get(cat.id) || 0, // 公開済み記事数
      }));

      return paginatedResponse({
        items: formattedCategories,
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
