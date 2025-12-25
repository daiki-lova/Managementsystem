import { Suspense } from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { ArticleCard } from '@/components/public/ArticleCard';
import {
  getPublishedArticles,
  getTrendingArticles,
  getCategories,
} from '@/lib/public-data';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';

// 動的レンダリングを強制（ビルド時のDB接続を回避）
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const subArticles = articles.slice(1, 4);

  return (
    <section className="border-t border-[#e5e5e5] px-5 py-10 md:px-[80px] md:py-[100px]">
      {/* Section Header */}
      <div className="mb-8 md:mb-12 flex items-end justify-between">
        <div>
          <h2 className="font-[var(--font-noto-sans)] font-light text-[11px] md:text-[12px] tracking-[4px] md:tracking-[5px] uppercase text-black">
            {title}
          </h2>
          <div className="h-[1px] w-[50px] md:w-[70px] bg-black mt-3" />
        </div>
        {showViewMore && categorySlug && (
          <a
            href={`/${categorySlug}`}
            className="font-[var(--font-noto-sans)] font-light text-[10px] tracking-[2px] uppercase text-[#666] hover:text-black transition-colors"
          >
            View All
          </a>
        )}
      </div>

      {/* 2-Column Layout for Desktop */}
      <div className="md:grid md:grid-cols-[1fr_340px] md:gap-12">
        {/* Main Article */}
        <div className="mb-8 md:mb-0">
          <ArticleCard article={mainArticle} variant="hero" />
        </div>

        {/* Sub Articles - Vertical Stack */}
        {subArticles.length > 0 && (
          <div className="space-y-6 md:space-y-8">
            {subArticles.map((article, index) => (
              <div key={article.id} className="border-b border-[#eee] pb-6 md:pb-8 last:border-b-0">
                <ArticleCard article={article} variant="horizontal" />
              </div>
            ))}
          </div>
        )}
      </div>
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
    <section className="py-12 md:py-[100px] border-t border-b border-[#e5e5e5]">
      <div className="px-5 md:px-[80px]">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="font-[var(--font-noto-sans)] font-light text-[10px] tracking-[4px] uppercase text-[#999] mb-2">
            What&apos;s Popular
          </p>
          <h2 className="font-[var(--font-noto-sans)] font-light text-[13px] md:text-[14px] tracking-[5px] md:tracking-[6px] uppercase text-black">
            Trending
          </h2>
        </div>

        {/* Trending Articles with Numbers */}
        <div className="space-y-8 md:grid md:grid-cols-3 md:gap-10 md:space-y-0">
          {articles.map((article, index) => (
            <div key={article.id} className="relative">
              {/* Large Number */}
              <span className="absolute -top-2 -left-2 md:-top-4 md:-left-4 font-[var(--font-noto-sans)] font-extralight text-[48px] md:text-[64px] text-[#f0f0f0] leading-none z-0 select-none">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="relative z-10">
                <ArticleCard article={article} variant="grid" showAuthor={false} />
              </div>
            </div>
          ))}
        </div>
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
      <section className="px-5 pt-8 pb-10 md:px-[80px] md:pt-[180px] md:pb-[100px]">
        <div className="text-center py-20">
          <p className="font-[var(--font-noto-sans-jp)] font-light text-[#999] tracking-[1px]">
            記事がまだ公開されていません
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-5 pt-8 pb-10 md:px-[80px] md:pt-[180px] md:pb-[100px]">
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
    <section className="border-t border-[#e5e5e5] px-5 py-10 md:px-[80px] md:py-[100px]">
      <div className="mb-8 md:mb-12">
        <h2 className="font-[var(--font-noto-sans)] font-light text-[11px] md:text-[12px] tracking-[4px] md:tracking-[5px] uppercase text-black">
          Latest
        </h2>
        <div className="h-[1px] w-[50px] md:w-[70px] bg-black mt-3" />
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
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
      (article) => article.categories.slug === category.slug
    ).slice(0, 5);
  }

  return (
    <PublicPageLayout categories={categories}>
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
    </PublicPageLayout>
  );
}
