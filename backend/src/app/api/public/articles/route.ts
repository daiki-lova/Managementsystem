import { NextRequest, NextResponse } from "next/server";
import { paginatedResponse, getPagination, calculatePagination, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

// GET /api/public/articles - 公開記事一覧（認証不要）
export async function GET(request: NextRequest) {
  // 公開APIのレート制限: 60リクエスト/分
  const rateLimitResult = checkRateLimit(request, RATE_LIMIT_CONFIGS.public, "public-articles");
  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return errorResponse(
      "RATE_LIMITED",
      `リクエスト制限に達しました。${retryAfter}秒後に再試行してください`,
      429
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const { skip, take, page } = getPagination(searchParams);
    const categorySlug = searchParams.get("category");
    const brandSlug = searchParams.get("brand");

    // カテゴリフィルタ
    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      categoryId = category?.id;
    }

    // ブランドフィルタ
    let brandId: string | undefined;
    if (brandSlug) {
      const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true },
      });
      brandId = brand?.id;
    }

    const where = {
      status: "PUBLISHED" as const,
      ...(categoryId && { categoryId }),
      ...(brandId && { brandId }),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          publishedAt: true,
          thumbnail: {
            select: {
              url: true,
              altText: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          author: {
            select: {
              name: true,
              role: true,
              imageUrl: true,
            },
          },
          brand: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take,
      }),
      prisma.article.count({ where }),
    ]);

    const { totalPages } = calculatePagination(total, page, take);
    return paginatedResponse({
      items: articles,
      total,
      page,
      limit: take,
      totalPages,
    });
  } catch (error) {
    console.error("Public articles list error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
