'use client';

import HomePage from '@/components/public/figma/HomePage';
import { useRouter } from 'next/navigation';
import { useArticles, PublicArticle } from '@/lib/use-public-data';

export default function PublicHomePage() {
  const router = useRouter();
  const { articles, loading } = useArticles(undefined, 20);

  const handleArticleClick = (article?: PublicArticle) => {
    if (article) {
      router.push(`/${article.categories.slug}/${article.slug}`);
    } else if (articles.length > 0) {
      const first = articles[0];
      router.push(`/${first.categories.slug}/${first.slug}`);
    }
  };

  const handleNavigate = (page: string, category?: string) => {
    if (page === 'category' && category) {
      router.push(`/${category}`);
    } else if (page === 'article' && articles.length > 0) {
      const first = articles[0];
      router.push(`/${first.categories.slug}/${first.slug}`);
    }
  };

  return (
    <HomePage
      onArticleClick={() => handleArticleClick()}
      onNavigate={handleNavigate}
      articles={articles}
      loading={loading}
    />
  );
}
