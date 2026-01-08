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
import { sanitizeBlocks } from "@/lib/sanitize";
import { ArticleStatus, Prisma } from "@prisma/client";
import { auditLog } from "@/lib/audit-log";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 記事詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      const article = await prisma.articles.findUnique({
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
          categories: {
            select: { id: true, name: true, slug: true, color: true },
          },
          authors: {
            select: {
              id: true,
              name: true,
              role: true,
              imageUrl: true,
              bio: true,
            },
          },
          brands: {
            select: { id: true, name: true, slug: true },
          },
          media_assets: {
            select: { id: true, url: true, altText: true },
          },
          users: {
            select: { id: true, name: true, email: true },
          },
          article_tags: {
            select: {
              tags: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          article_conversions: {
            select: {
              position: true,
              conversions: {
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
          article_images: {
            select: {
              type: true,
              position: true,
              media_assets: {
                select: { id: true, url: true, altText: true },
              },
            },
          },
          article_knowledge_items: {
            select: {
              knowledge_items: {
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
        tags: article.article_tags.map((t) => t.tags),
        conversions: article.article_conversions.map((c) => ({
          ...c.conversions,
          position: c.position,
        })),
        images: article.article_images.map((i) => ({
          ...i.media_assets,
          type: i.type,
          position: i.position,
        })),
        knowledgeItems: article.article_knowledge_items.map((k) => k.knowledge_items),
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
    if ("id" in block) {
      return {
        id: block.id,
        type: block.type,
        content: block.content,
        data: block.data as Record<string, unknown> | undefined,
      };
    }

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

// 記事更新スキーマ
const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: commonSchemas.slug.optional(),
  blocks: z.array(z.union([blockSchema, frontendBlockSchema])).optional(),
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
      const normalizedBlocks = data.blocks ? normalizeBlocks(data.blocks) : undefined;

      // 存在確認
      const existing = await prisma.articles.findUnique({
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
          await tx.slug_history.upsert({
            where: { oldSlug: previousSlug },
            update: { newSlug: data.slug! },
            create: {
              id: randomUUID(),
              articleId: id,
              oldSlug: previousSlug,
              newSlug: data.slug!,
            },
          });
        }
        // タグの更新
        if (data.tagIds !== undefined) {
          await tx.article_tags.deleteMany({ where: { articleId: id } });
          if (data.tagIds.length > 0) {
            await tx.article_tags.createMany({
              data: data.tagIds.map((tagId) => ({ articleId: id, tagId })),
            });
          }
        }

        // コンバージョンの更新
        if (data.conversionIds !== undefined) {
          await tx.article_conversions.deleteMany({ where: { articleId: id } });
          if (data.conversionIds.length > 0) {
            await tx.article_conversions.createMany({
              data: data.conversionIds.map((conversionId, index) => ({
                id: randomUUID(),
                articleId: id,
                conversionId,
                position: index,
              })),
            });
          }
        }

        // カテゴリ変更時の記事数更新
        if (data.categoryId && data.categoryId !== existing.categoryId) {
          await tx.categories.update({
            where: { id: existing.categoryId },
            data: { articlesCount: { decrement: 1 } },
          });
          await tx.categories.update({
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
        return tx.articles.update({
          where: { id },
          data: {
            title: data.title,
            slug: data.slug,
            blocks: normalizedBlocks as unknown as Prisma.InputJsonValue | undefined,
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
        const existing = await prisma.articles.findUnique({
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
        await prisma.articles.delete({ where: { id } });

        // 監査ログ
        await auditLog.articleDeletePermanent(request, user.id, id, existing.title);

        return successResponse({ message: "記事を完全に削除しました" });
      });
    } else {
      // ゴミ箱移動（認証ユーザー可）
      return await withAuth(request, async (user) => {
        const { id } = await params;

        // 存在確認
        const existing = await prisma.articles.findUnique({
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
        await prisma.articles.update({
          where: { id },
          data: {
            status: ArticleStatus.DELETED,
            deletedAt: new Date(),
          },
        });

        // カテゴリの記事数を減らす（カテゴリが設定されている場合のみ）
        if (existing.categoryId) {
          await prisma.categories.update({
            where: { id: existing.categoryId },
            data: { articlesCount: { decrement: 1 } },
          });
        }

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
