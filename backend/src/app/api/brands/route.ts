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

// ブランド一覧取得
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const { page, limit } = parsePaginationParams(searchParams);

      const total = await prisma.brand.count();
      const { skip, take, totalPages } = calculatePagination(total, page, limit);

      const brands = await prisma.brand.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
        },
        orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      });

      return paginatedResponse({
        items: brands.map((b) => ({
          ...b,
          articlesCount: b._count.articles,
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
    console.error("Get brands error:", error);
    return ApiErrors.internalError();
  }
}

// ブランド作成スキーマ
const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: commonSchemas.slug,
  description: z.string().max(500).optional(),
  logoUrl: commonSchemas.url.optional(),
  isDefault: z.boolean().default(false),
});

// ブランド作成（オーナーのみ）
export async function POST(request: NextRequest) {
  try {
    return await withOwnerAuth(request, async () => {
      const data = await validateBody(request, createBrandSchema);

      // isDefault=trueの場合、他のブランドのisDefaultをfalseにする
      if (data.isDefault) {
        await prisma.brand.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const brand = await prisma.brand.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          logoUrl: data.logoUrl,
          isDefault: data.isDefault,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logoUrl: true,
          isDefault: true,
          createdAt: true,
        },
      });

      return successResponse(brand, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
