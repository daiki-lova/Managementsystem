import Link from 'next/link';
import { PublicPageLayout } from '@/components/public/PublicPageLayout';

export default function NotFound() {
  return (
    <PublicPageLayout categories={[]}>
      {/* ヘッダースペース */}
      <div className="h-[108px] md:h-[160px]" />

      <main className="flex-1 flex items-center justify-center px-5 py-20">
        <div className="text-center">
          <h1 className="font-[var(--font-noto-sans)] font-bold text-[80px] md:text-[120px] tracking-[4px] text-black mb-4">
            404
          </h1>
          <h2 className="font-[var(--font-noto-sans-jp)] font-medium text-[18px] md:text-[24px] text-black mb-6">
            ページが見つかりませんでした
          </h2>
          <p className="font-[var(--font-noto-sans-jp)] font-light text-[14px] md:text-[16px] text-black mb-10 max-w-[400px] mx-auto">
            お探しのページは削除されたか、URLが変更された可能性があります。
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-black text-white font-[var(--font-noto-sans)] font-bold text-[12px] tracking-[1.5px] uppercase hover:bg-gray-800 transition-colors"
          >
            ホームへ戻る
          </Link>
        </div>
      </main>
    </PublicPageLayout>
  );
}
