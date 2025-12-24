import { getPublishedArticles, getCategories } from '@/lib/public-data';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import HomePage from '@/components/public/figma/HomePage';

// 動的レンダリングを強制（ビルド時のDB接続を回避）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicHomePage() {
  const [
    { articles },
    categories,
  ] = await Promise.all([
    getPublishedArticles(undefined, 50),
    getCategories(),
  ]);

  return (
    <PublicPageLayout categories={categories}>
      <HomePage
        articles={articles}
        categories={categories}
      />
    </PublicPageLayout>
  );
}
