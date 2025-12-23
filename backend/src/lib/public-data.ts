import prisma from './prisma';
import { cache } from 'react';

import { PublicArticle, Category } from './public-types';
export type { PublicArticle, Category };

// ISR用のrevalidate設定（60秒）
export const REVALIDATE_INTERVAL = 60;

// 記事クエリ用のselect定義
const articleSelect = {
  id: true,
  title: true,
  slug: true,
  blocks: true,
  publishedAt: true,
  metaTitle: true,
  metaDescription: true,
  ogpImageUrl: true,
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
      bio: true,
      imageUrl: true,
      qualifications: true,
    },
  },
  media_assets: {
    select: {
      url: true,
      altText: true,
    },
  },
  article_tags: {
    select: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} as const;

// 記事をPublicArticle形式に変換
function mapArticle(article: {
  id: string;
  title: string;
  slug: string;
  blocks: unknown;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogpImageUrl: string | null;
  categories: { id: string; name: string; slug: string };
  authors: { id: string; name: string; role: string; bio: string; imageUrl: string | null; qualifications: unknown };
  media_assets: { url: string; altText: string | null } | null;
  article_tags: Array<{ tags: { id: string; name: string; slug: string } }>;
}): PublicArticle {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    blocks: article.blocks,
    publishedAt: article.publishedAt,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    ogpImageUrl: article.ogpImageUrl,
    categories: article.categories,
    authors: article.authors,
    media_assets: article.media_assets,
    tags: article.article_tags.map((t) => t.tags),
  };
}

// 公開記事一覧取得（カテゴリ別）
export const getPublishedArticles = cache(async (
  categorySlug?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ articles: PublicArticle[]; total: number }> => {
  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { not: null },
    ...(categorySlug && {
      categories: {
        slug: categorySlug,
      },
    }),
  };

  const [articles, total] = await Promise.all([
    prisma.articles.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: offset,
      take: limit,
      select: articleSelect,
    }),
    prisma.articles.count({ where }),
  ]);

  return {
    articles: articles.map(mapArticle),
    total,
  };
});

// 単一記事取得
export const getArticleBySlug = cache(async (
  slug: string
): Promise<PublicArticle | null> => {
  const article = await prisma.articles.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    select: articleSelect,
  });

  if (!article) return null;

  return mapArticle(article);
});

// カテゴリ一覧取得
export const getCategories = cache(async () => {
  return prisma.categories.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      articlesCount: true,
    },
    orderBy: { name: 'asc' },
  });
});

// カテゴリ詳細取得
export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.categories.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      color: true,
      articlesCount: true,
    },
  });
});

// 関連記事取得
export const getRelatedArticles = cache(async (
  articleId: string,
  categoryId: string,
  limit: number = 8
): Promise<PublicArticle[]> => {
  const articles = await prisma.articles.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      categoryId,
      id: { not: articleId },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: articleSelect,
  });

  return articles.map(mapArticle);
});

// 人気記事取得（アナリティクスデータに基づく）
export const getPopularArticles = cache(async (
  limit: number = 5
): Promise<PublicArticle[]> => {
  const articles = await prisma.articles.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    orderBy: [
      { publishedAt: 'desc' }, // TODO: アナリティクスのPVでソート
    ],
    take: limit,
    select: articleSelect,
  });

  return articles.map(mapArticle);
});

// トレンド記事取得
export const getTrendingArticles = cache(async (
  limit: number = 3
): Promise<PublicArticle[]> => {
  // 直近7日間の記事を取得
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const articles = await prisma.articles.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        gte: sevenDaysAgo,
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: articleSelect,
  });

  return articles.map(mapArticle);
});

// 旧Slug検索（301リダイレクト用）
export const getArticleByOldSlug = cache(async (
  oldSlug: string
): Promise<{ newSlug: string } | null> => {
  const history = await prisma.slug_history.findUnique({
    where: { oldSlug },
    select: { newSlug: true },
  });

  return history;
});

// タグ一覧取得
export const getTags = cache(async () => {
  return prisma.tags.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { article_tags: true },
      },
    },
    orderBy: { name: 'asc' },
  });
});

// タグ詳細取得
export const getTagBySlug = cache(async (slug: string) => {
  return prisma.tags.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
});

// タグ別記事取得
export const getArticlesByTag = cache(async (
  tagSlug: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ articles: PublicArticle[]; total: number }> => {
  const tag = await prisma.tags.findUnique({
    where: { slug: tagSlug },
    select: { id: true },
  });

  if (!tag) {
    return { articles: [], total: 0 };
  }

  const where = {
    status: 'PUBLISHED' as const,
    publishedAt: { not: null },
    article_tags: {
      some: { tagId: tag.id },
    },
  };

  const [articles, total] = await Promise.all([
    prisma.articles.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: offset,
      take: limit,
      select: articleSelect,
    }),
    prisma.articles.count({ where }),
  ]);

  return {
    articles: articles.map(mapArticle),
    total,
  };
});
