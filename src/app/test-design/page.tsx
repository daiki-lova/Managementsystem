import { prisma } from '@/lib/prisma';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/public/figma/ImageWithFallback';

// ISR: 開発中は無効化
export const revalidate = 0;

// 記事データ取得
async function getArticles() {
  const articles = await prisma.articles.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    include: {
      categories: true,
      authors: true,
      media_assets: true,
    },
  });
  return articles;
}

// カテゴリ取得
async function getCategories() {
  const categories = await prisma.categories.findMany({
    orderBy: { name: 'asc' },
  });
  return categories;
}

// ヒーローカード
function HeroCard({ article }: { article: any }) {
  const imageUrl = article.media_assets?.url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80';
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Link href={`/${article.categories.slug}/${article.slug}`} className="block group cursor-pointer overflow-hidden">
      <div className="relative aspect-[16/10] w-full">
        <ImageWithFallback
          src={imageUrl}
          alt={article.title}
          className="absolute inset-0 size-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.75)] via-[rgba(0,0,0,0.15)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col justify-end">
          <p className="font-['Noto_Sans:Regular',sans-serif] text-[10px] text-[rgba(255,255,255,0.85)] tracking-[3px] uppercase mb-4">
            {article.categories.name}
          </p>
          <h2 className="font-['Noto_Sans_JP:Regular',sans-serif] font-normal text-[26px] leading-[1.4] text-white tracking-[0.5px] mb-5 group-hover:opacity-90 transition-opacity line-clamp-3">
            {article.title}
          </h2>
          <p className="font-['Noto_Sans:Light',sans-serif] text-[10px] text-[rgba(255,255,255,0.75)] tracking-[2px] uppercase mb-2">
            By {article.authors.name}
          </p>
          <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[11px] text-[rgba(255,255,255,0.7)] tracking-[0.5px]">
            {dateStr}
          </p>
        </div>
      </div>
    </Link>
  );
}

// グリッドカード
function GridCard({ article }: { article: any }) {
  const imageUrl = article.media_assets?.url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80';
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Link href={`/${article.categories.slug}/${article.slug}`} className="block group cursor-pointer">
      <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-4">
        <ImageWithFallback
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <p className="font-['Noto_Sans:Regular',sans-serif] text-[10px] text-[#555] tracking-[3px] uppercase mb-3">
        {article.categories.name}
      </p>
      <h3 className="font-['Noto_Sans_JP:Regular',sans-serif] font-normal text-[15px] leading-[1.5] text-black tracking-[0.3px] group-hover:opacity-70 transition-opacity line-clamp-2 mb-4">
        {article.title}
      </h3>
      <p className="font-['Noto_Sans:Light',sans-serif] text-[10px] text-[#777] tracking-[2px] uppercase mb-2">
        By {article.authors.name}
      </p>
      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[11px] text-[#999] tracking-[0.5px]">
        {dateStr}
      </p>
    </Link>
  );
}

// セクションヘッダー
function SectionHeader({ title, categorySlug }: { title: string; categorySlug?: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-4 mb-10">
      <div>
        <h2 className="font-['Noto_Sans:Light',sans-serif] text-[13px] text-black tracking-[4px] uppercase">
          {title}
        </h2>
        <div className="h-[1px] w-[60px] bg-black mt-3" />
      </div>
      {categorySlug && (
        <Link
          href={`/${categorySlug}`}
          className="font-['Noto_Sans:Light',sans-serif] text-[11px] tracking-[3px] uppercase text-[#666] hover:text-black transition-colors flex items-center gap-2"
        >
          View All
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="group-hover:translate-x-1 transition-transform">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// トレンドカード
function TrendingCard({ article, index }: { article: any; index: number }) {
  const imageUrl = article.media_assets?.url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80';
  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Link href={`/${article.categories.slug}/${article.slug}`} className="flex gap-5 group cursor-pointer">
      <div className="w-[120px] h-[120px] flex-shrink-0 overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <p className="font-['Noto_Sans:Regular',sans-serif] text-[10px] text-[#555] tracking-[3px] uppercase mb-2">
          {article.categories.name}
        </p>
        <h3 className="font-['Noto_Sans_JP:Regular',sans-serif] font-normal text-[15px] leading-[1.5] text-black tracking-[0.3px] group-hover:opacity-70 transition-opacity line-clamp-2 mb-3">
          {article.title}
        </h3>
        <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[11px] text-[#999] tracking-[0.5px]">
          {dateStr}
        </p>
      </div>
    </Link>
  );
}

export default async function TestDesignPage() {
  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategories(),
  ]);

  // ヒーロー記事
  const heroArticle = articles[0];
  // サブ記事（2-5番目）
  const subArticles = articles.slice(1, 5);
  // トレンド記事
  const trendingArticles = articles.slice(0, 3);
  // カテゴリ別記事
  const categoryArticles: Record<string, typeof articles> = {};
  for (const cat of categories) {
    categoryArticles[cat.slug] = articles.filter(a => a.categories.slug === cat.slug).slice(0, 4);
  }

  return (
    <PublicPageLayout categories={categories}>
      {/* モバイル用ヘッダースペース */}
      <div className="h-[108px] md:hidden" />

      <main className="max-w-[1400px] mx-auto">
        {/* ヒーローセクション */}
        <section className="px-6 pt-8 pb-12 md:px-16 md:pt-[140px] md:pb-20">
          {heroArticle && <HeroCard article={heroArticle} />}
        </section>

        {/* Latest セクション */}
        <section className="px-6 py-12 md:px-16 md:py-20">
          <SectionHeader title="Latest" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
            {subArticles.map((article) => (
              <GridCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        {/* Trending セクション */}
        <section className="bg-[#fafafa] px-6 py-12 md:px-16 md:py-20">
          <div className="text-center mb-12">
            <p className="font-['Noto_Sans:Light',sans-serif] text-[10px] tracking-[4px] uppercase text-[#999] mb-2">
              What&apos;s Popular
            </p>
            <h2 className="font-['Noto_Sans:Light',sans-serif] text-[13px] tracking-[5px] uppercase text-black">
              Trending
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {trendingArticles.map((article, index) => (
              <TrendingCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </section>

        {/* カテゴリ別セクション */}
        {categories.map((category) => {
          const catArticles = categoryArticles[category.slug] || [];
          if (catArticles.length === 0) return null;

          return (
            <section key={category.slug} className="px-6 py-12 md:px-16 md:py-20">
              <SectionHeader title={category.name} categorySlug={category.slug} />
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
                {catArticles.map((article) => (
                  <GridCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </PublicPageLayout>
  );
}
