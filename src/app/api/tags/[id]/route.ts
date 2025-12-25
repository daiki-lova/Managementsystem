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
import { isAppError, handlePrismaError } from "@/lib/errors";
import { auditLog } from "@/lib/audit-log";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// タグ取得
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    return await withAuth(request, async () => {
      const { id } = await context.params;

      const tag = await prisma.tags.findUnique({
        where: { id },
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
      });

      if (!tag) {
        return ApiErrors.notFound("タグ");
      }

      return successResponse({
        ...tag,
        _count: {
          articles: tag._count.article_tags,
        },
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get tag error:", error);
    return ApiErrors.internalError();
  }
}

// タグ更新スキーマ
const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: commonSchemas.slug.optional(),
});

// タグ更新（オーナーのみ）
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    return await withOwnerAuth(request, async (user) => {
      const { id } = await context.params;
      const data = await validateBody(request, updateTagSchema);

      // 既存タグチェック
      const existingTag = await prisma.tags.findUnique({
        where: { id },
      });

      if (!existingTag) {
        return ApiErrors.notFound("タグ");
      }

      // スラッグ重複チェック
      if (data.slug && data.slug !== existingTag.slug) {
        const duplicateSlug = await prisma.tags.findUnique({
          where: { slug: data.slug },
        });

        if (duplicateSlug) {
          return errorResponse("DUPLICATE_SLUG", "このスラッグは既に使用されています", 400);
        }
      }

      const tag = await prisma.tags.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          articlesCount: true,
          updatedAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "TAG_UPDATE",
        user.id,
        "tag",
        tag.id,
        { name: tag.name }
      );

      return successResponse(tag);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// タグ削除（オーナーのみ）
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    return await withAuth(request, async (user) => {
      const { id } = await context.params;

      // 既存タグチェック
      const existingTag = await prisma.tags.findUnique({
        where: { id },
        include: {
          _count: {
            select: { article_tags: true },
          },
        },
      });

      if (!existingTag) {
        return ApiErrors.notFound("タグ");
      }

      // 関連する記事がある場合は警告
      if (existingTag._count.article_tags > 0) {
        // 関連を削除してからタグを削除
        await prisma.article_tags.deleteMany({
          where: { tagId: id },
        });
      }

      await prisma.tags.delete({
        where: { id },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "TAG_DELETE",
        user.id,
        "tag",
        id,
        { name: existingTag.name }
      );

      return successResponse({ id });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
