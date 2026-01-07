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

// タグ一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);
      const search = searchParams.get("search") || undefined;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { slug: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const total = await prisma.tags.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const tags = await prisma.tags.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          articlesCount: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { article_tags: true },
          },
        },
        orderBy: { name: "asc" },
      });

      // フォーマット
      const formattedTags = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        articlesCount: tag.articlesCount,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
        _count: {
          articles: tag._count.article_tags,
        },
      }));

      return paginatedResponse({
        items: formattedTags,
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
    console.error("Get tags error:", error);
    return ApiErrors.internalError();
  }
}

// タグ作成スキーマ
const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: commonSchemas.slug,
});

// タグ作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createTagSchema);

      // 重複チェック
      const existingTag = await prisma.tags.findUnique({
        where: { slug: data.slug },
      });

      if (existingTag) {
        return errorResponse("DUPLICATE_SLUG", "このスラッグは既に使用されています", 400);
      }

      const tag = await prisma.tags.create({
        data: {
          id: randomUUID(),
          name: data.name,
          slug: data.slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          articlesCount: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "TAG_CREATE",
        user.id,
        "tag",
        tag.id,
        { name: tag.name }
      );

      return successResponse(tag, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
