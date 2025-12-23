import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ImageWithFallback } from '@/components/public/ImageWithFallback';
import Link from 'next/link';
import {
  getTagBySlug,
  getArticlesByTag,
  getCategories,
  type PublicArticle,
} from '@/lib/public-data';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';

// ISR: 60秒ごとに再検証
export const revalidate = 60;

// 動的パラメータを許可（ビルド時にDBアクセス不要）
export const dynamicParams = true;

// メタデータ生成
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return {
      title: 'タグが見つかりません | RADIANCE',
    };
  }

  return {
    title: `#${tag.name} の記事一覧 | RADIANCE`,
    description: `${tag.name}に関する記事一覧。ヨガ・ピラティス・ウェルネスの情報をお届けします。`,
    openGraph: {
      title: `#${tag.name} の記事一覧 | RADIANCE`,
      description: `${tag.name}に関する記事一覧`,
      type: 'website',
    },
  };
}

// ページネーションコンポーネント
function Pagination({
  currentPage,
  totalPages,
  tagSlug,
}: {
  currentPage: number;
  totalPages: number;
  tagSlug: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-12 mb-8 md:gap-4 md:mt-[120px] md:mb-[120px]">
      <Link
        href={currentPage > 1 ? `/tag/${tagSlug}?page=${currentPage - 1}` : '#'}
        className={`p-2 hover:bg-gray-100 transition-colors ${currentPage === 1 ? 'opacity-30 pointer-events-none' : ''
          }`}
        aria-disabled={currentPage === 1}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      <div className="flex gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Link
            key={page}
            href={`/tag/${tagSlug}?page=${page}`}
            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center border font-[var(--font-noto-sans-jp)] font-medium text-[13px] transition-colors ${currentPage === page
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-gray-100'
              }`}
          >
            {page}
          </Link>
        ))}
      </div>

      <Link
        href={currentPage < totalPages ? `/tag/${tagSlug}?page=${currentPage + 1}` : '#'}
        className={`p-2 hover:bg-gray-100 transition-colors ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : ''
          }`}
        aria-disabled={currentPage === totalPages}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// 記事グリッドコンポーネント
function ArticleGrid({
  articles,
}: {
  articles: PublicArticle[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-[32px] md:gap-y-[80px]">
      {articles.map((article) => (
        <Link
          key={article.id}
          href={`/${article.categories.slug}/${article.slug}`}
          className="flex flex-col cursor-pointer group"
        >
          <div className="aspect-square overflow-hidden bg-gray-100">
            <ImageWithFallback
              src={article.media_assets?.url || `https://images.unsplash.com/photo-1610562269919-86791081ad29?w=800&q=80`}
              alt={article.media_assets?.altText || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="mt-3 md:mt-4">
            <p className="font-[var(--font-noto-sans)] font-bold text-[9px] md:text-[11.8px] tracking-[1.4px] md:tracking-[1.8px] uppercase mb-2 md:mb-4">
              {article.categories.name}
            </p>
            <h2 className="font-[var(--font-noto-sans-jp)] font-medium leading-[1.4] text-[13px] md:text-[18px] text-black group-hover:underline line-clamp-3">
              {article.title}
            </h2>
            <p className="font-[var(--font-noto-sans)] font-bold text-[9px] md:text-[12px] tracking-[1.2px] md:tracking-[1.964px] uppercase mt-2 md:mt-4">
              By {article.authors.name}
            </p>
            <p className="font-[var(--font-noto-sans-jp)] font-medium text-[10px] md:text-[12px] text-[#666] md:text-black mt-1 md:mt-2">
              {article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
                : ''}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const itemsPerPage = 16;
  const currentPage = Math.max(1, parseInt(pageParam || '1', 10));
  const offset = (currentPage - 1) * itemsPerPage;

  const [{ articles, total }, allCategories] = await Promise.all([
    getArticlesByTag(slug, itemsPerPage, offset),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <PublicPageLayout categories={allCategories}>
      {/* モバイル用ヘッダースペース */}
      <div className="h-[108px] md:h-[160px]" />

      <main className="px-5 py-8 md:px-[104px] md:py-[100px]">
        {/* タグタイトル */}
        <div className="mb-8 md:mb-[80px]">
          <div className="flex items-center gap-3">
            <span className="text-[24px] md:text-[36px] text-gray-400">#</span>
            <h1 className="font-[var(--font-noto-sans-jp)] font-bold text-[24px] md:text-[48px] tracking-[1.5px] md:tracking-[2px]">
              {tag.name}
            </h1>
          </div>
          <div className="h-[3px] md:h-[4px] w-[60px] md:w-[120px] bg-black mt-3 md:mt-[24px]" />
          <p className="font-[var(--font-noto-sans-jp)] text-[14px] md:text-[16px] text-gray-600 mt-4">
            {total}件の記事
          </p>
        </div>

        {/* 記事がない場合 */}
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-[var(--font-noto-sans-jp)]">
              このタグには記事がまだありません
            </p>
          </div>
        ) : (
          <>
            {/* 記事グリッド */}
            <ArticleGrid articles={articles} />

            {/* ページネーション */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              tagSlug={slug}
            />
          </>
        )}
      </main>
    </PublicPageLayout>
  );
}
