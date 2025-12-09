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
import { ArticleStatus, Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 記事詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const article = await prisma.article.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          previousSlug: true,
          blocks: true,
          status: true,
          publishedAt: true,
          deletedAt: true,
          version: true,
          metaTitle: true,
          metaDescription: true,
          ogpImageUrl: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: { id: true, name: true, slug: true, color: true },
          },
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              imageUrl: true,
              bio: true,
            },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          thumbnail: {
            select: { id: true, url: true, altText: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            select: {
              tag: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          conversions: {
            select: {
              position: true,
              conversion: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  url: true,
                  thumbnailUrl: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
          images: {
            select: {
              type: true,
              position: true,
              mediaAsset: {
                select: { id: true, url: true, altText: true },
              },
            },
          },
          knowledgeItems: {
            select: {
              knowledgeItem: {
                select: { id: true, title: true, type: true },
              },
            },
          },
        },
      });

      if (!article) {
        return ApiErrors.notFound("記事");
      }

      // フラット化して返却
      return successResponse({
        ...article,
        tags: article.tags.map((t) => t.tag),
        conversions: article.conversions.map((c) => ({
          ...c.conversion,
          position: c.position,
        })),
        images: article.images.map((i) => ({
          ...i.mediaAsset,
          type: i.type,
          position: i.position,
        })),
        knowledgeItems: article.knowledgeItems.map((k) => k.knowledgeItem),
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Get article error:", error);
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

// 記事更新スキーマ
const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: commonSchemas.slug.optional(),
  blocks: z.array(blockSchema).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
  categoryId: commonSchemas.id.optional(),
  authorId: commonSchemas.id.optional(),
  brandId: commonSchemas.id.optional(),
  thumbnailId: commonSchemas.id.optional().nullable(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  ogpImageUrl: commonSchemas.url.optional().nullable(),
  tagIds: z.array(commonSchemas.id).optional(),
  conversionIds: z.array(commonSchemas.id).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  // 楽観的ロック用バージョン（必須）
  version: z.number().int().min(1).optional(),
});

// 記事更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;
      const data = await validateBody(request, updateArticleSchema);

      // 存在確認
      const existing = await prisma.article.findUnique({
        where: { id },
        select: { id: true, slug: true, categoryId: true, status: true, version: true },
      });

      if (!existing) {
        throw new NotFoundError("記事");
      }

      // 楽観的ロックのチェック（versionが指定されている場合のみ）
      if (data.version !== undefined && data.version !== existing.version) {
        return errorResponse(
          "CONFLICT",
          "この記事は他のユーザーによって更新されています。ページを更新して最新のデータを取得してください。",
          409
        );
      }

      // スラッグ変更時は前のスラッグを保存（301リダイレクト用）
      const slugChanged = data.slug && data.slug !== existing.slug;
      const previousSlug = slugChanged ? existing.slug : undefined;

      // トランザクションで更新
      const article = await prisma.$transaction(async (tx) => {
        // スラッグ変更時はSlugHistoryに記録（301リダイレクト用）
        if (slugChanged && previousSlug) {
          // 既存の履歴があれば更新、なければ作成
          await tx.slugHistory.upsert({
            where: { oldSlug: previousSlug },
            update: { newSlug: data.slug! },
            create: {
              articleId: id,
              oldSlug: previousSlug,
              newSlug: data.slug!,
            },
          });
        }
        // タグの更新
        if (data.tagIds !== undefined) {
          await tx.articleTag.deleteMany({ where: { articleId: id } });
          if (data.tagIds.length > 0) {
            await tx.articleTag.createMany({
              data: data.tagIds.map((tagId) => ({ articleId: id, tagId })),
            });
          }
        }

        // コンバージョンの更新
        if (data.conversionIds !== undefined) {
          await tx.articleConversion.deleteMany({ where: { articleId: id } });
          if (data.conversionIds.length > 0) {
            await tx.articleConversion.createMany({
              data: data.conversionIds.map((conversionId, index) => ({
                articleId: id,
                conversionId,
                position: index,
              })),
            });
          }
        }

        // カテゴリ変更時の記事数更新
        if (data.categoryId && data.categoryId !== existing.categoryId) {
          await tx.category.update({
            where: { id: existing.categoryId },
            data: { articlesCount: { decrement: 1 } },
          });
          await tx.category.update({
            where: { id: data.categoryId },
            data: { articlesCount: { increment: 1 } },
          });
        }

        // 公開日時の設定
        let publishedAt = undefined;
        if (data.status === ArticleStatus.PUBLISHED && !existing.status) {
          publishedAt = new Date();
        } else if (data.publishedAt) {
          publishedAt = new Date(data.publishedAt);
        }

        // 記事の更新（versionをインクリメント）
        return tx.article.update({
          where: { id },
          data: {
            title: data.title,
            slug: data.slug,
            blocks: data.blocks as unknown as Prisma.InputJsonValue | undefined,
            status: data.status,
            categoryId: data.categoryId,
            authorId: data.authorId,
            brandId: data.brandId,
            thumbnailId: data.thumbnailId,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
            ogpImageUrl: data.ogpImageUrl,
            previousSlug: previousSlug || undefined,
            publishedAt,
            version: { increment: 1 },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            version: true,
            updatedAt: true,
          },
        });
      });

      return successResponse(article);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}

// 記事削除（ゴミ箱移動 or 永久削除）
// 永久削除はオーナー権限が必要
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      // 永久削除（オーナーのみ）
      return await withOwnerAuth(request, async (user) => {
        const { id } = await params;

        // 存在確認
        const existing = await prisma.article.findUnique({
          where: { id },
          select: { id: true, title: true, status: true, categoryId: true },
        });

        if (!existing) {
          return ApiErrors.notFound("記事");
        }

        if (existing.status !== ArticleStatus.DELETED) {
          return ApiErrors.badRequest(
            "完全削除はゴミ箱内の記事のみ可能です"
          );
        }

        // SlugHistoryも含めて削除（Cascadeで自動削除される）
        await prisma.article.delete({ where: { id } });

        // 監査ログ
        await auditLog.articleDeletePermanent(request, user.id, id, existing.title);

        return successResponse({ message: "記事を完全に削除しました" });
      });
    } else {
      // ゴミ箱移動（認証ユーザー可）
      return await withAuth(request, async (user) => {
        const { id } = await params;

        // 存在確認
        const existing = await prisma.article.findUnique({
          where: { id },
          select: { id: true, title: true, status: true, categoryId: true },
        });

        if (!existing) {
          return ApiErrors.notFound("記事");
        }

        if (existing.status === ArticleStatus.DELETED) {
          return ApiErrors.badRequest("すでにゴミ箱にあります");
        }

        // ゴミ箱移動
        await prisma.article.update({
          where: { id },
          data: {
            status: ArticleStatus.DELETED,
            deletedAt: new Date(),
          },
        });

        // カテゴリの記事数を減らす
        await prisma.category.update({
          where: { id: existing.categoryId },
          data: { articlesCount: { decrement: 1 } },
        });

        // 監査ログ
        await auditLog.articleTrash(request, user.id, id, existing.title);

        return successResponse({ message: "記事をゴミ箱に移動しました" });
      });
    }
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    const appError = handlePrismaError(error);
    return errorResponse(appError.code, appError.message, appError.statusCode);
  }
}
