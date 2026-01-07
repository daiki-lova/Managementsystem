import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { deleteImage, STORAGE_BUCKETS } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// メディア詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const media = await prisma.media_assets.findUnique({
        where: { id },
        select: {
          id: true,
          url: true,
          fileName: true,
          altText: true,
          source: true,
          showInLibrary: true,
          width: true,
          height: true,
          fileSize: true,
          createdAt: true,
          updatedAt: true,
          media_asset_tags: {
            select: {
              tags: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          _count: {
            select: {
              articles: true,
              article_images: true,
            },
          },
        },
      });

      if (!media) {
        return ApiErrors.notFound("メディア");
      }

      return successResponse({
        ...media,
        tags: media.media_asset_tags.map((t) => t.tags),
        usageCount:
          media._count.articles + media._count.article_images,
        _count: undefined,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get media error:", error);
    return ApiErrors.internalError();
  }
}

// メディア更新スキーマ
const updateMediaSchema = z.object({
  altText: z.string().max(200).optional().nullable(),
  showInLibrary: z.boolean().optional(),
  tagIds: z.array(commonSchemas.id).optional(),
});

// メディア更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, updateMediaSchema);

      // 存在確認
      const existing = await prisma.media_assets.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("メディア");
      }

      // トランザクションで更新
      const media = await prisma.$transaction(async (tx) => {
        // タグの更新
        if (data.tagIds !== undefined) {
          await tx.media_asset_tags.deleteMany({ where: { mediaAssetId: id } });
          if (data.tagIds.length > 0) {
            await tx.media_asset_tags.createMany({
              data: data.tagIds.map((tagId) => ({ mediaAssetId: id, tagId })),
            });
          }
        }

        return tx.media_assets.update({
          where: { id },
          data: {
            altText: data.altText,
            showInLibrary: data.showInLibrary,
          },
          select: {
            id: true,
            url: true,
            fileName: true,
            altText: true,
            showInLibrary: true,
            updatedAt: true,
          },
        });
      });

      return successResponse(media);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// メディア削除（論理削除）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.media_assets.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              articles: true,
              article_images: true,
            },
          },
        },
      });

      if (!existing) {
        return ApiErrors.notFound("メディア");
      }

      // 使用中のメディアは削除不可
      const usageCount =
        existing._count.articles + existing._count.article_images;
      if (usageCount > 0) {
        return ApiErrors.badRequest(
          `このメディアは${usageCount}件の記事で使用されています。先に記事から削除してください。`
        );
      }

      // 論理削除
      await prisma.media_assets.update({
        where: { id },
        data: {
          isDeleted: true,
          showInLibrary: false,
        },
      });

      return successResponse({ message: "メディアを削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
