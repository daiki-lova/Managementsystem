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
import { sanitizeBlocks } from "@/lib/sanitize";
import { ArticleStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

function generateSlugBase(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "article";
}

function generateUniqueSlug(input: string): string {
  const base = generateSlugBase(input).slice(0, 93); // 100 - "-" - 6 chars
  // crypto.randomUUID() を使用して暗号的に安全なランダムIDを生成
  const randomId = randomUUID().slice(0, 8);
  return `${base}-${randomId}`;
}

// SQLインジェクション防止: 許可されたソートフィールドのホワイトリスト
const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'publishedAt',
  'status',
] as const;

type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];

const frontendBlockSchema = z.object({
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
  order: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

type NormalizedBlock = { id: string; type: string; content?: string; data?: Record<string, unknown> };

function normalizeBlocks(blocks: Array<z.infer<typeof blockSchema> | z.infer<typeof frontendBlockSchema>>): NormalizedBlock[] {
  const normalized = blocks.map((block) => {
    // Backend/native block format already contains `id`
    if ("id" in block) {
      return {
        id: block.id,
        type: block.type,
        content: block.content,
        data: block.data as Record<string, unknown> | undefined,
      };
    }

    // Frontend format: generate id and map metadata -> data
    return {
      id: randomUUID(),
      type: block.type,
      content: block.content,
      data: (block.metadata as Record<string, unknown> | undefined) ?? undefined,
    };
  });

  // XSS対策: HTMLブロックをサニタイズ
  return sanitizeBlocks(normalized);
}

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

      // SQLインジェクション防止: ソートフィールドをホワイトリストで検証
      const rawSortBy = searchParams.get("sortBy") || "createdAt";
      const sortBy: AllowedSortField = ALLOWED_SORT_FIELDS.includes(rawSortBy as AllowedSortField)
        ? (rawSortBy as AllowedSortField)
        : "createdAt";

      const rawSortOrder = searchParams.get("sortOrder") || "desc";
      const sortOrder: "asc" | "desc" = rawSortOrder === "asc" ? "asc" : "desc";

      // where条件構築
      const where: Prisma.articlesWhereInput = {
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

      const total = await prisma.articles.count({ where });
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      console.log(`[API] GET /articles - Params: status=${status}, page=${page}, limit=${limit}`);
      console.log(`[API] GET /articles - Where:`, JSON.stringify(where));

      const articles = await prisma.articles.findMany({
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
          displayOrder: true,
          categories: {
            select: { id: true, name: true, slug: true, color: true },
          },
          authors: {
            select: { id: true, name: true, imageUrl: true },
          },
          brands: {
            select: { id: true, name: true, slug: true },
          },
          media_assets: {
            select: { id: true, url: true },
          },
          article_tags: {
            select: {
              tags: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          users: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      });

      console.log(`[API] GET /articles - Found ${articles.length} articles`);

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
  slug: commonSchemas.slug.optional(),
  blocks: z.array(z.union([blockSchema, frontendBlockSchema])).default([]),
  status: z.nativeEnum(ArticleStatus).default(ArticleStatus.DRAFT),
  categoryId: commonSchemas.id.optional(),
  authorId: commonSchemas.id.optional(),
  brandId: commonSchemas.id.optional(),
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

      const [categoryFallback, authorFallback, brandDefault, brandFallback] =
        await Promise.all([
          prisma.categories.findFirst({
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          prisma.authors.findFirst({
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          prisma.brands.findFirst({
            where: { isDefault: true },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
          prisma.brands.findFirst({
            orderBy: { createdAt: "asc" },
            select: { id: true },
          }),
        ]);

      const categoryId = data.categoryId ?? categoryFallback?.id;
      const authorId = data.authorId ?? authorFallback?.id;
      const brandId = data.brandId ?? brandDefault?.id ?? brandFallback?.id;

      if (!categoryId) {
        return ApiErrors.badRequest("カテゴリが存在しません。先にカテゴリを作成してください。");
      }
      if (!authorId) {
        return ApiErrors.badRequest("監修者が存在しません。先に監修者を作成してください。");
      }
      if (!brandId) {
        return ApiErrors.badRequest("ブランドが存在しません。先にブランドを作成してください。");
      }

      const slug = data.slug ?? generateUniqueSlug(data.title);
      const blocks = normalizeBlocks(data.blocks ?? []);

      const article = await prisma.articles.create({
        data: {
          id: randomUUID(),
          title: data.title,
          slug,
          blocks: blocks as unknown as Prisma.InputJsonValue,
          status: data.status,
          categoryId,
          authorId,
          brandId,
          thumbnailId: data.thumbnailId,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          createdById: user.id,
          // タグの紐づけ
          article_tags: data.tagIds
            ? {
              create: data.tagIds.map((tagId) => ({ tagId })),
            }
            : undefined,
          // コンバージョンの紐づけ
          article_conversions: data.conversionIds
            ? {
              create: data.conversionIds.map((conversionId, index) => ({
                id: randomUUID(),
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
      await prisma.categories.update({
        where: { id: categoryId },
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
