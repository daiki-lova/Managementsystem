import prisma from './prisma';
import { cache } from 'react';

// 公開記事の型定義
export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  blocks: unknown;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogpImageUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
    role: string;
    bio: string;
    imageUrl: string | null;
    qualifications: unknown;
  };
  thumbnail: {
    url: string;
    altText: string | null;
  } | null;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

// ISR用のrevalidate設定（60秒）
export const REVALIDATE_INTERVAL = 60;

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
      category: {
        slug: categorySlug,
      },
    }),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        blocks: true,
        publishedAt: true,
        metaTitle: true,
        metaDescription: true,
        ogpImageUrl: true,
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
            bio: true,
            imageUrl: true,
            qualifications: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
            altText: true,
          },
        },
        tags: {
          select: {
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
    }),
    prisma.article.count({ where }),
  ]);

  return {
    articles: articles.map((article) => ({
      ...article,
      tags: article.tags.map((t) => t.tag),
    })),
    total,
  };
});

// 単一記事取得
export const getArticleBySlug = cache(async (
  slug: string
): Promise<PublicArticle | null> => {
  const article = await prisma.article.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      blocks: true,
      publishedAt: true,
      metaTitle: true,
      metaDescription: true,
      ogpImageUrl: true,
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
          bio: true,
          imageUrl: true,
          qualifications: true,
        },
      },
      thumbnail: {
        select: {
          url: true,
          altText: true,
        },
      },
      tags: {
        select: {
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

  if (!article) return null;

  return {
    ...article,
    tags: article.tags.map((t) => t.tag),
  };
});

// カテゴリ一覧取得
export const getCategories = cache(async () => {
  return prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      articlesCount: true,
    },
    orderBy: { name: 'asc' },
  });
});

// カテゴリ詳細取得
export const getCategoryBySlug = cache(async (slug: string) => {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
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
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
      categoryId,
      id: { not: articleId },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      blocks: true,
      publishedAt: true,
      metaTitle: true,
      metaDescription: true,
      ogpImageUrl: true,
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
          bio: true,
          imageUrl: true,
          qualifications: true,
        },
      },
      thumbnail: {
        select: {
          url: true,
          altText: true,
        },
      },
      tags: {
        select: {
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

  return articles.map((article) => ({
    ...article,
    tags: article.tags.map((t) => t.tag),
  }));
});

// 人気記事取得（アナリティクスデータに基づく）
export const getPopularArticles = cache(async (
  limit: number = 5
): Promise<PublicArticle[]> => {
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { not: null },
    },
    orderBy: [
      { publishedAt: 'desc' }, // TODO: アナリティクスのPVでソート
    ],
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      blocks: true,
      publishedAt: true,
      metaTitle: true,
      metaDescription: true,
      ogpImageUrl: true,
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
          bio: true,
          imageUrl: true,
          qualifications: true,
        },
      },
      thumbnail: {
        select: {
          url: true,
          altText: true,
        },
      },
      tags: {
        select: {
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

  return articles.map((article) => ({
    ...article,
    tags: article.tags.map((t) => t.tag),
  }));
});

// トレンド記事取得
export const getTrendingArticles = cache(async (
  limit: number = 3
): Promise<PublicArticle[]> => {
  // 直近7日間の記事を取得
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: {
        not: null,
        gte: sevenDaysAgo,
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      blocks: true,
      publishedAt: true,
      metaTitle: true,
      metaDescription: true,
      ogpImageUrl: true,
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
          bio: true,
          imageUrl: true,
          qualifications: true,
        },
      },
      thumbnail: {
        select: {
          url: true,
          altText: true,
        },
      },
      tags: {
        select: {
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

  return articles.map((article) => ({
    ...article,
    tags: article.tags.map((t) => t.tag),
  }));
});

// 旧Slug検索（301リダイレクト用）
export const getArticleByOldSlug = cache(async (
  oldSlug: string
): Promise<{ newSlug: string } | null> => {
  const history = await prisma.slugHistory.findUnique({
    where: { oldSlug },
    select: { newSlug: true },
  });

  return history;
});
