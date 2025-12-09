import { Suspense } from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { ArticleCard } from '@/components/public/ArticleCard';
import {
  getPublishedArticles,
  getTrendingArticles,
  getCategories,
} from '@/lib/public-data';

// ISR: 60秒ごとに再検証
export const revalidate = 60;

// カテゴリーセクションコンポーネント
function CategorySection({
  title,
  articles,
  showViewMore = true,
  categorySlug,
}: {
  title: string;
  articles: Awaited<ReturnType<typeof getPublishedArticles>>['articles'];
  showViewMore?: boolean;
  categorySlug?: string;
}) {
  if (articles.length === 0) return null;

  const mainArticle = articles[0];
  const subArticles = articles.slice(1, 5);

  return (
    <section className="border-t border-[#e0e0e0] px-5 py-8 md:px-[64px] md:py-[80px]">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-[var(--font-noto-sans)] font-bold text-[14px] md:text-[21px] tracking-[1.5px] md:tracking-[2.1px] uppercase">
            {title}
          </h2>
          <div className="h-[2px] md:h-[3px] w-[40px] md:w-[60px] bg-black mt-2" />
        </div>
        {showViewMore && categorySlug && (
          <a
            href={`/${categorySlug}`}
            className="font-[var(--font-noto-sans)] font-bold text-[10px] md:text-[12px] tracking-[1.2px] uppercase underline hover:opacity-70"
          >
            More
          </a>
        )}
      </div>

      {/* Main Article */}
      <div className="mb-6">
        <ArticleCard article={mainArticle} variant="hero" />
      </div>

      {/* Sub Articles */}
      {subArticles.length > 0 && (
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
          {subArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="horizontal" />
          ))}
        </div>
      )}
    </section>
  );
}

// トレンドセクション
function TrendingSection({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getTrendingArticles>>;
}) {
  if (articles.length === 0) return null;

  return (
    <section className="bg-[#f8f8f8] py-8 md:py-[60px]">
      <div className="px-5 mb-5 md:px-[64px]">
        <div className="border-t border-b border-[#e0e0e0] py-4">
          <h2 className="font-[var(--font-noto-sans-jp)] font-light text-[14px] md:text-[18px] tracking-[1.8px] md:tracking-[2.5px] uppercase text-center">
            TRENDING POST
          </h2>
        </div>
      </div>
      <div className="px-5 space-y-4 md:px-[64px] md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="horizontal" />
        ))}
      </div>
    </section>
  );
}

// ヒーローセクション
function HeroSection({
  article,
}: {
  article: Awaited<ReturnType<typeof getPublishedArticles>>['articles'][0] | null;
}) {
  if (!article) {
    return (
      <section className="px-5 pt-6 pb-8 md:px-[64px] md:pt-[180px] md:pb-[80px]">
        <div className="text-center py-20">
          <p className="text-gray-500">記事がまだ公開されていません</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-6 pb-8 md:px-[64px] md:pt-[180px] md:pb-[80px]">
      <ArticleCard article={article} variant="hero" />
    </section>
  );
}

// Recent Posts セクション
function RecentPostsSection({
  articles,
}: {
  articles: Awaited<ReturnType<typeof getPublishedArticles>>['articles'];
}) {
  if (articles.length === 0) return null;

  return (
    <section className="border-t border-[#e0e0e0] px-5 py-8 md:px-[64px] md:py-[80px]">
      <div className="mb-5">
        <h2 className="font-[var(--font-noto-sans)] font-bold text-[14px] md:text-[21px] tracking-[1.5px] md:tracking-[2.1px] uppercase">
          Recent Posts
        </h2>
        <div className="h-[2px] md:h-[3px] w-[40px] md:w-[60px] bg-black mt-2" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} variant="grid" showAuthor={false} />
        ))}
      </div>
    </section>
  );
}

// ローディングフォールバック
function LoadingFallback() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-gray-200 mb-3" />
      <div className="h-3 bg-gray-200 w-1/4 mb-2" />
      <div className="h-5 bg-gray-200 w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 w-1/3" />
    </div>
  );
}

export default async function HomePage() {
  // データ取得（並列実行）
  const [
    { articles: allArticles },
    trendingArticles,
    categories,
  ] = await Promise.all([
    getPublishedArticles(undefined, 50),
    getTrendingArticles(3),
    getCategories(),
  ]);

  // ヒーロー記事（最新）
  const heroArticle = allArticles[0] || null;

  // Recent Posts（2-5番目）
  const recentArticles = allArticles.slice(1, 5);

  // カテゴリー別記事を取得
  const categoryArticles: Record<string, typeof allArticles> = {};
  for (const category of categories) {
    categoryArticles[category.slug] = allArticles.filter(
      (article) => article.category.slug === category.slug
    ).slice(0, 5);
  }

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <Header />

      {/* モバイル用ヘッダースペース */}
      <div className="h-[108px] md:hidden" />

      <main>
        <Suspense fallback={<LoadingFallback />}>
          {/* ヒーローセクション */}
          <HeroSection article={heroArticle} />

          {/* Recent Posts */}
          <RecentPostsSection articles={recentArticles} />

          {/* Trending Posts */}
          <TrendingSection articles={trendingArticles} />

          {/* カテゴリー別セクション */}
          {categories.map((category) => (
            <CategorySection
              key={category.slug}
              title={category.name}
              articles={categoryArticles[category.slug] || []}
              categorySlug={category.slug}
            />
          ))}
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
