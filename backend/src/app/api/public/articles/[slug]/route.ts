import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/public/articles/:slug - 公開記事詳細（認証不要）
export async function GET(request: NextRequest, { params }: RouteParams) {
  // 公開APIのレート制限
  const rateLimitResult = checkRateLimit(request, RATE_LIMIT_CONFIGS.public, "public-article-detail");
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return errorResponse(
      "RATE_LIMITED",
      `リクエスト制限に達しました。${retryAfter}秒後に再試行してください`,
      429
    );
  }

  try {
    const { slug } = await params;

    // まず現在のスラッグで検索
    let article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            qualifications: true,
            bio: true,
            imageUrl: true,
            socialLinks: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
            altText: true,
          },
        },
        images: {
          include: {
            mediaAsset: {
              select: {
                url: true,
                altText: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
        conversions: {
          include: {
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
        tags: {
          include: {
            tag: {
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

    // 見つからない場合はSlugHistoryまたはpreviousSlugで検索（301リダイレクト用）
    if (!article) {
      // SlugHistoryを検索
      const slugHistory = await prisma.slugHistory.findUnique({
        where: { oldSlug: slug },
        select: {
          newSlug: true,
          article: {
            select: {
              slug: true,
              status: true,
              category: { select: { slug: true } },
            },
          },
        },
      });

      if (slugHistory && slugHistory.article.status === "PUBLISHED") {
        // 301リダイレクトを返す
        return NextResponse.json(
          {
            success: false,
            redirect: true,
            newSlug: slugHistory.article.slug,
            newUrl: `/${slugHistory.article.category.slug}/${slugHistory.article.slug}`,
          },
          {
            status: 301,
            headers: {
              Location: `/${slugHistory.article.category.slug}/${slugHistory.article.slug}`,
            },
          }
        );
      }

      // 削除済みの記事の場合は410 Gone
      if (slugHistory && slugHistory.article.status === "DELETED") {
        return NextResponse.json(
          { success: false, error: { message: "この記事は削除されました" } },
          { status: 410 }
        );
      }

      // 旧previousSlugフィールドでも検索（後方互換性）
      const articleWithOldSlug = await prisma.article.findFirst({
        where: { previousSlug: slug },
        select: { slug: true, status: true, category: { select: { slug: true } } },
      });

      if (articleWithOldSlug && articleWithOldSlug.status === "PUBLISHED") {
        // 301リダイレクトを返す
        return NextResponse.json(
          {
            success: false,
            redirect: true,
            newSlug: articleWithOldSlug.slug,
            newUrl: `/${articleWithOldSlug.category.slug}/${articleWithOldSlug.slug}`,
          },
          {
            status: 301,
            headers: {
              Location: `/${articleWithOldSlug.category.slug}/${articleWithOldSlug.slug}`,
            },
          }
        );
      }

      // 完全に見つからない場合は404
      return NextResponse.json(
        { success: false, error: { message: "記事が見つかりません" } },
        { status: 404 }
      );
    }

    // 削除済みの場合は410 Gone
    if (article.status === "DELETED") {
      return NextResponse.json(
        { success: false, error: { message: "この記事は削除されました" } },
        { status: 410 }
      );
    }

    // 公開済みでない場合は404
    if (article.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: { message: "記事が見つかりません" } },
        { status: 404 }
      );
    }

    // レスポンス用にデータを整形
    const response = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      blocks: article.blocks,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      ogpImageUrl: article.ogpImageUrl || article.thumbnail?.url,
      publishedAt: article.publishedAt,
      category: article.category,
      author: article.author,
      brand: article.brand,
      thumbnail: article.thumbnail,
      images: article.images.map((img) => ({
        type: img.type,
        position: img.position,
        url: img.mediaAsset.url,
        altText: img.mediaAsset.altText,
      })),
      conversions: article.conversions.map((ac) => ({
        position: ac.position,
        ...ac.conversion,
      })),
      tags: article.tags.map((at) => at.tag),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Public article detail error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
