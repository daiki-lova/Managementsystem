import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth, withOwnerAuth, AuthUser } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError, handlePrismaError, NotFoundError } from "@/lib/errors";
import { UserRole, Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 監修者詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      const { id } = await params;

      const author = await prisma.authors.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          role: true,
          qualifications: true,
          bio: true,
          imageUrl: true,
          socialLinks: true,
          categories: true, // Explicit
          tags: true,       // Explicit
          // systemPromptはオーナーのみ閲覧可
          ...(user.role === UserRole.OWNER && { systemPrompt: true }),
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { articles: true },
          },
        },
      });

      if (!author) {
        return ApiErrors.notFound("監修者");
      }

      return successResponse({
        ...author,
        articlesCount: author._count.articles,
        _count: undefined,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get author error:", error);
    return ApiErrors.internalError();
  }
}

// 監修者更新スキーマ（ライター用）
const updateAuthorSchemaWriter = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: commonSchemas.slug.optional(),
  role: z.string().max(100).optional(),
  qualifications: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  bio: z.string().optional(),
  imageUrl: commonSchemas.url.optional().nullable(),
  avatarUrl: commonSchemas.url.optional().nullable(), // imageUrlのエイリアス
  socialLinks: z.record(z.string()).optional().nullable(),
});

// 監修者更新スキーマ（オーナー用）
const updateAuthorSchemaOwner = updateAuthorSchemaWriter.extend({
  systemPrompt: z.string().optional().nullable(), // 空文字列も許可（削除用）
});

// 監修者更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user: AuthUser) => {
      const { id } = await params;

      // ライターはsystemPromptを更新不可
      const schema =
        user.role === UserRole.OWNER
          ? updateAuthorSchemaOwner
          : updateAuthorSchemaWriter;

      const data = await validateBody(request, schema);

      // 存在確認
      const existing = await prisma.authors.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundError("監修者");
      }

      // systemPromptフィールドの取得（オーナースキーマのみに存在）
      const hasSystemPrompt = "systemPrompt" in data;
      const systemPromptValue = hasSystemPrompt ? (data.systemPrompt as string | null | undefined) : undefined;
      // フィールド名のエイリアス解決
      const resolvedImageUrl = data.imageUrl !== undefined ? data.imageUrl : data.avatarUrl;

      const author = await prisma.authors.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          role: data.role,
          qualifications: data.qualifications,
          categories: data.categories,
          tags: data.tags,
          bio: data.bio,
          imageUrl: resolvedImageUrl,
          socialLinks: data.socialLinks === null
            ? Prisma.JsonNull
            : data.socialLinks as unknown as Prisma.InputJsonValue | undefined,
          // systemPromptはフィールドが存在する場合のみ更新（空文字列/nullで削除可能）
          ...(hasSystemPrompt && { systemPrompt: systemPromptValue || "" }),
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
          ...(user.role === UserRole.OWNER && { systemPrompt: true }),
          updatedAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_UPDATE",
        user.id,
        "author",
        author.id,
        { name: author.name }
      );

      return successResponse(author);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// 監修者削除（オーナーのみ）
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async (user) => {
      const { id } = await params;

      // 存在確認
      const existing = await prisma.authors.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              articles: true,
              generation_jobs: true,
              knowledge_items: true
            }
          }
        },
      });

      if (!existing) {
        return ApiErrors.notFound("監修者");
      }

      // 紐づくデータがある場合は別の監修者に移動
      if (existing._count.articles > 0 || existing._count.generation_jobs > 0 || existing._count.knowledge_items > 0) {
        const fallback = await prisma.authors.findFirst({
          where: { id: { not: id } },
          orderBy: { createdAt: 'asc' },
          select: { id: true }
        });

        if (fallback) {
          await prisma.$transaction([
            prisma.articles.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            }),
            prisma.generation_jobs.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            }),
            prisma.knowledge_items.updateMany({
              where: { authorId: id },
              data: { authorId: fallback.id }
            })
          ]);
        } else {
          return ApiErrors.badRequest(
            `この監修者には関連データが紐づいており、移行先の監修者も存在しません。先に別の監修者を作成してください。\n(記事: ${existing._count.articles}, ジョブ: ${existing._count.generation_jobs}, ナレッジ: ${existing._count.knowledge_items})`
          );
        }
      }

      await prisma.authors.delete({
        where: { id },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "AUTHOR_DELETE",
        user.id,
        "author",
        id,
        { name: existing.name }
      );

      return successResponse({ message: "監修者を削除しました" });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
