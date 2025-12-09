import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, AuthUser } from "@/lib/auth";
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
import { ArticleStatus, Prisma } from "@prisma/client";

// 記事一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      // フィルタパラメータ
      const status = searchParams.get("status") as ArticleStatus | null;
      const categoryId = searchParams.get("categoryId");
      const authorId = searchParams.get("authorId");
      const brandId = searchParams.get("brandId");
      const search = searchParams.get("search");
      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortOrder = (searchParams.get("sortOrder") || "desc") as
        | "asc"
        | "desc";

      // where条件構築
      const where: Prisma.ArticleWhereInput = {
        // DELETEDは通常表示しない
        ...(status ? { status } : { status: { not: ArticleStatus.DELETED } }),
        ...(categoryId && { categoryId }),
        ...(authorId && { authorId }),
        ...(brandId && { brandId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const total = await prisma.article.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const articles = await prisma.article.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
          author: {
            select: { id: true, name: true, imageUrl: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          thumbnail: {
            select: { id: true, url: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      });

      return paginatedResponse({
        items: articles,
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
    console.error("Get articles error:", error);
    return ApiErrors.internalError();
  }
}

// ブロックデータスキーマ
const blockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "p",
    "h2",
    "h3",
    "h4",
    "image",
    "html",
    "blockquote",
    "ul",
    "ol",
    "hr",
    "table",
    "code",
  ]),
  content: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
});

// 記事作成スキーマ
const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: commonSchemas.slug,
  blocks: z.array(blockSchema).default([]),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.DRAFT),
  categoryId: commonSchemas.id,
  authorId: commonSchemas.id,
  brandId: commonSchemas.id,
  thumbnailId: commonSchemas.id.optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  tagIds: z.array(commonSchemas.id).optional(),
  conversionIds: z.array(commonSchemas.id).optional(),
});

// 記事作成
export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      const data = await validateBody(request, createArticleSchema);

      const article = await prisma.article.create({
        data: {
          title: data.title,
          slug: data.slug,
          blocks: data.blocks as unknown as Prisma.InputJsonValue,
          status: data.status,
          categoryId: data.categoryId,
          authorId: data.authorId,
          brandId: data.brandId,
          thumbnailId: data.thumbnailId,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          createdById: user.id,
          // タグの紐づけ
          tags: data.tagIds
            ? {
                create: data.tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
          // コンバージョンの紐づけ
          conversions: data.conversionIds
            ? {
                create: data.conversionIds.map((conversionId, index) => ({
                  conversionId,
                  position: index,
                })),
              }
            : undefined,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      });

      // カテゴリの記事数を更新
      await prisma.category.update({
        where: { id: data.categoryId },
        data: { articlesCount: { increment: 1 } },
      });

      return successResponse(article, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
