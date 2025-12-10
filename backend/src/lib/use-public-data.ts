"use client";

import { useState, useEffect } from "react";

// 公開記事の型定義
export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: string | null;
  media_assets: {
    url: string;
    altText: string | null;
  } | null;
  categories: {
    name: string;
    slug: string;
  };
  authors: {
    name: string;
    role: string;
    imageUrl: string | null;
  };
  brands: {
    name: string;
    slug: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  articlesCount: number;
}

interface ArticlesResponse {
  success: boolean;
  data: PublicArticle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

// 記事一覧を取得するフック
export function useArticles(categorySlug?: string, limit: number = 20) {
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (categorySlug) params.set("category", categorySlug);
        params.set("limit", limit.toString());

        const response = await fetch(`/api/public/articles?${params}`);
        const data: ArticlesResponse = await response.json();

        if (data.success) {
          setArticles(data.data);
        } else {
          setError("Failed to fetch articles");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchArticles();
  }, [categorySlug, limit]);

  return { articles, loading, error };
}

// カテゴリ一覧を取得するフック
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch("/api/public/categories");
        const data: CategoriesResponse = await response.json();

        if (data.success) {
          setCategories(data.data);
        } else {
          setError("Failed to fetch categories");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// 日付をフォーマットする関数
export function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// フォールバック画像配列
export const fallbackImages = [
  "https://images.unsplash.com/photo-1610562269919-86791081ad29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1525296416200-59aaed194d0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1622206509367-cb16e7f50e69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1649888639789-b611bc359d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
];

// 画像URLを取得（nullの場合はフォールバック）
export function getImageUrl(article: PublicArticle, index: number = 0): string {
  return article.media_assets?.url || fallbackImages[index % fallbackImages.length];
}
