import Link from 'next/link';

import { Category } from '@/lib/public-types';

interface FooterProps {
  categories?: Category[];
}

export function Footer({ categories = [] }: FooterProps) {
  return (
    <footer className="bg-black text-white py-16 max-md:py-12 w-full">
      <div className="mx-auto px-[64px] max-md:px-[40px]">
        {/* Logo Section */}
        <div className="text-center max-md:text-left mb-14 max-md:mb-8">
          <img
            src="/images/logo-footer.png"
            alt="RADIANCE Logo"
            className="h-[50px] w-auto mx-auto max-md:mx-0 mb-3 max-md:mb-2 object-contain max-md:h-8"
          />
          <p className="text-[#777] text-[11px] max-md:text-[9px] tracking-[2.5px] max-md:tracking-[1.5px] uppercase font-[var(--font-noto-sans)]">
            心と体を輝かせるライフスタイルマガジン
          </p>
        </div>

        {/* Category Grid - Desktop */}
        <div className="mb-14 max-md:hidden">
          <div className="flex justify-center items-center gap-8 flex-wrap">
            {categories.map((cat, index) => (
              <div key={cat.slug} className="flex items-center gap-8">
                <Link
                  href={`/${cat.slug}`}
                  className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-[var(--font-noto-sans)] font-medium uppercase border-b border-transparent hover:border-white pb-1"
                >
                  {cat.name}
                </Link>
                {index < categories.length - 1 && (
                  <span className="text-[#444] text-[13px]">|</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category - Mobile (Vertical) */}
        <div className="hidden max-md:block mb-8">
          <h3 className="text-white text-[11px] tracking-[2px] uppercase font-[var(--font-noto-sans)] font-bold mb-4">
            カテゴリー
          </h3>
          <div className="flex flex-col gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-[var(--font-noto-sans)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Border Line */}
        <div className="h-[1px] bg-[#333] mb-8 w-full max-md:mb-6" />

        {/* Bottom Links */}
        <div className="flex justify-center items-center gap-8 mb-8 max-md:flex-col max-md:items-start max-md:gap-3 max-md:mb-6">
          <Link
            href="/contact"
            className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-[var(--font-noto-sans-jp)]"
          >
            お問い合わせ
          </Link>
          <Link
            href="/about"
            className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-[var(--font-noto-sans-jp)]"
          >
            運営会社
          </Link>
          <Link
            href="/privacy"
            className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-[var(--font-noto-sans-jp)]"
          >
            プライバシーポリシー
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-center max-md:text-left">
          <p className="text-[#555] text-[11px] max-md:text-[10px] tracking-[2px] max-md:tracking-[1px] uppercase font-[var(--font-noto-sans-jp)] font-light">
            &copy; 2025 Radiance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
