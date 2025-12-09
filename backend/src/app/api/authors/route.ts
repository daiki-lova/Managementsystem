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

// 監修者一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.author.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const authors = await prisma.author.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          role: true,
          qualifications: true,
          bio: true,
          imageUrl: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return paginatedResponse({
        items: authors.map((a) => ({
          ...a,
          articlesCount: a._count.articles,
          _count: undefined,
        })),
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

      const author = await prisma.author.create({
        data: {
          name: data.name,
          role: data.role,
          qualifications: data.qualifications,
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
