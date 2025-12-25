import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { isAppError } from "@/lib/errors";
import { errorResponse, ApiErrors, successResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/preview/article/:id - プレビュー用記事詳細（認証必須、ステータス問わず）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withAuth(request, async () => {
      const { id } = await params;

      // 削除済み以外の記事を取得（下書き、レビュー中、公開済み全て）
      const article = await prisma.articles.findFirst({
        where: {
          id,
          status: { not: "DELETED" },
        },
        include: {
          categories: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          authors: {
            select: {
              id: true,
              name: true,
              role: true,
              qualifications: true,
              bio: true,
              imageUrl: true,
            },
          },
          brands: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          media_assets: {
            select: {
              url: true,
              altText: true,
            },
          },
          article_images: {
            include: {
              media_assets: {
                select: {
                  url: true,
                  altText: true,
                },
              },
            },
            orderBy: { position: "asc" },
          },
          article_conversions: {
            include: {
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
          article_tags: {
            include: {
              tags: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        return ApiErrors.notFound("記事");
      }

      // レスポンス用にデータを整形
      const response = {
        id: article.id,
        title: article.title,
        slug: article.slug,
        status: article.status,
        blocks: article.blocks,
        metaTitle: article.metaTitle,
        metaDescription: article.metaDescription,
        ogpImageUrl: article.ogpImageUrl || article.media_assets?.url,
        publishedAt: article.publishedAt,
        category: article.categories,
        author: article.authors,
        brand: article.brands,
        thumbnail: article.media_assets,
        images: article.article_images.map((img) => ({
          type: img.type,
          position: img.position,
          url: img.media_assets.url,
          altText: img.media_assets.altText,
        })),
        conversions: article.article_conversions.map((ac) => ({
          position: ac.position,
          ...ac.conversions,
        })),
        tags: article.article_tags.map((at) => at.tags),
      };

      return successResponse(response);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Preview article error:", error);
    return ApiErrors.internalError();
  }
}
