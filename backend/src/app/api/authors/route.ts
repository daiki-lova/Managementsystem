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

// 監修者一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.authors.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const authors = await prisma.authors.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          role: true,
          qualifications: true,
          bio: true,
          imageUrl: true,
          socialLinks: true,
          categories: true, // Explicit categories
          tags: true,       // Explicit tags
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
          articles: {
            select: {
              categories: { select: { name: true } },
              article_tags: { select: { tags: { select: { name: true } } } },
            },
            take: 20, // Limit to recent articles for performance
          }
        },
        orderBy: { name: "asc" },
      });

      // Type helper for the complex Prisma result
      type AuthorWithRelations = typeof authors[number];

      return paginatedResponse({
        items: authors.map((a: AuthorWithRelations) => {
          // Use explicit categories/tags if available, otherwise fallback to computed or empty
          const explicitCategories = (a.categories as string[]) || [];
          const explicitTags = (a.tags as string[]) || [];

          // Compute unique categories and tags from articles safely (for reference or fallback)
          const computedCategories = Array.from(new Set(
            a.articles
              .filter(article => article.categories) // Filter out null categories
              .map(article => article.categories.name)
          )).sort();

          const computedTags = Array.from(new Set(
            a.articles.flatMap(article =>
              article.article_tags.map(at => at.tags.name)
            )
          )).sort();

          return {
            ...a,
            articlesCount: a._count.articles,
            // Return explicit ones as primary, or merge? User wants to "enter" them, so return explicit.
            // If explicit is empty, maybe we shouldn't show computed in the "edit" field, but we might want to show them in "display".
            // For now, let's return explicit keys.
            categories: explicitCategories.length > 0 ? explicitCategories : computedCategories,
            tags: explicitTags.length > 0 ? explicitTags : computedTags,

            // Also return raw values for UI to distinguish
            explicitCategories,
            explicitTags,
            computedCategories,
            computedTags,

            _count: undefined,
            articles: undefined, // Remove raw articles data from response
          };
        }),
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
    console.error("Get authors error:", error);
    return ApiErrors.internalError();
  }
}

// 監修者作成スキーマ
const createAuthorSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100), // 肩書き
  qualifications: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]), // New
  tags: z.array(z.string()).default([]),       // New
  bio: z.string().min(1),
  imageUrl: commonSchemas.url.optional(),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  systemPrompt: z.string().min(1), // オーナーのみ設定可
});

// 監修者作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const data = await validateBody(request, createAuthorSchema);

      const author = await prisma.authors.create({
        data: {
          id: randomUUID(),
          name: data.name,
          role: data.role,
          qualifications: data.qualifications,
          categories: data.categories,
          tags: data.tags,
          bio: data.bio,
          imageUrl: data.imageUrl,
          socialLinks: data.socialLinks,
          systemPrompt: data.systemPrompt,
        },
        select: {
          id: true,
          name: true,
          role: true,
          qualifications: true,
          categories: true,
          tags: true,
          bio: true,
          imageUrl: true,
          socialLinks: true,
          systemPrompt: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_CREATE",
        user.id,
        "author",
        author.id,
        { name: author.name }
      );

      return successResponse(author, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
