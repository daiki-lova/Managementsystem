import { Suspense } from 'react';
import {
  getPublishedArticles,
  getCategories,
} from '@/lib/public-data';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import HomePage from '@/components/public/figma/HomePage';

// 動的レンダリングを強制（ビルド時のDB接続を回避）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ローディングフォールバック
function LoadingFallback() {
  return (
    <div className="animate-pulse px-8 pt-[180px]">
      <div className="aspect-[3/4] max-w-[400px] bg-gray-100 mb-3 mx-auto" />
      <div className="h-3 bg-gray-100 w-1/4 mb-2 mx-auto" />
      <div className="h-5 bg-gray-100 w-3/4 mb-3 mx-auto" />
    </div>
  );
}

export default async function HomePageRoute() {
  // データ取得（並列実行）
  const [
    { articles: allArticles },
    categories,
  ] = await Promise.all([
    getPublishedArticles(undefined, 50),
    getCategories(),
  ]);

  return (
    <PublicPageLayout categories={categories}>
      {/* モバイル用ヘッダースペース */}
      <div className="h-[108px] md:hidden" />

      <main>
        <Suspense fallback={<LoadingFallback />}>
          <HomePage articles={allArticles} categories={categories} />
        </Suspense>
      </main>
    </PublicPageLayout>
  );
}
