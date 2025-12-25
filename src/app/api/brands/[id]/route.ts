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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ブランド詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const brand = await prisma.brands.findUnique({
        where: { id },
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
      });

      if (!brand) {
        return ApiErrors.notFound("ブランド");
      }

      return successResponse({
        ...brand,
        articlesCount: brand._count.articles,
        _count: undefined,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get brand error:", error);
    return ApiErrors.internalError();
  }
}

// ブランド更新スキーマ
const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: commonSchemas.slug.optional(),
  description: z.string().max(500).optional().nullable(),
  logoUrl: commonSchemas.url.optional().nullable(),
  isDefault: z.boolean().optional(),
});

// ブランド更新（オーナーのみ）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, updateBrandSchema);

      // 存在確認
      const existing = await prisma.brands.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("ブランド");
      }

      // isDefault=trueの場合、他のブランドのisDefaultをfalseにする
      if (data.isDefault) {
        await prisma.brands.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const brand = await prisma.brands.update({
        where: { id },
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
          updatedAt: true,
        },
      });

      return successResponse(brand);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// ブランド削除（オーナーのみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withOwnerAuth(request, async () => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.brands.findUnique({
        where: { id },
        include: { _count: { select: { articles: true } } },
      });

      if (!existing) {
        return ApiErrors.notFound("ブランド");
      }

      // デフォルトブランドは削除不可
      if (existing.isDefault) {
        return ApiErrors.badRequest("デフォルトブランドは削除できません");
      }

      // 紐づく記事がある場合は削除不可
      if (existing._count.articles > 0) {
        return ApiErrors.badRequest(
          `このブランドには${existing._count.articles}件の記事が紐づいています。先に記事のブランドを変更してください。`
        );
      }

      await prisma.brands.delete({
        where: { id },
      });

      return successResponse({ message: "ブランドを削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
