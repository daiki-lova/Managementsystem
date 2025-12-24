import Link from 'next/link';
import { ImageWithFallback } from './ImageWithFallback';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    publishedAt: Date | string | null;
    categories: {
      name: string;
      slug: string;
    };
    authors: {
      name: string;
    };
    media_assets: {
      url: string;
      altText: string | null;
    } | null;
  };
  variant?: 'hero' | 'grid' | 'horizontal' | 'small';
  showAuthor?: boolean;
  showDate?: boolean;
}

// フォールバック画像URL
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1610562269919-86791081ad29?w=800&q=80',
  'https://images.unsplash.com/photo-1591258370814-01609b341790?w=800&q=80',
  'https://images.unsplash.com/photo-1525296416200-59aaed194d0c?w=800&q=80',
  'https://images.unsplash.com/photo-1622206509367-cb16e7f50e69?w=800&q=80',
  'https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=800&q=80',
];

function getFallbackImage(slug: string): string {
  const index = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

export function ArticleCard({
  article,
  variant = 'grid',
  showAuthor = true,
  showDate = true,
}: ArticleCardProps) {
  const imageUrl = article.media_assets?.url || getFallbackImage(article.slug);
  const formattedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年M月d日', { locale: ja })
    : '';

  if (variant === 'hero') {
    return (
      <Link href={`/${article.categories.slug}/${article.slug}`} className="block group cursor-pointer">
        <div className="aspect-[16/10] overflow-hidden bg-gray-100 mb-5">
          <ImageWithFallback
            src={imageUrl}
            alt={article.media_assets?.altText || article.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
        <p className="font-[var(--font-noto-sans)] font-normal text-[10px] tracking-[3px] uppercase mb-3 text-[#555]">
          {article.categories.name}
        </p>
        <h2 className="font-[var(--font-noto-sans-jp)] font-normal text-[22px] md:text-[28px] leading-[1.4] mb-4 group-hover:opacity-70 transition-opacity">
          {article.title}
        </h2>
        {showAuthor && (
          <p className="font-[var(--font-noto-sans)] font-light text-[10px] tracking-[2px] uppercase mb-1 text-[#777]">
            By {article.authors.name}
          </p>
        )}
        {showDate && formattedDate && (
          <p className="font-[var(--font-noto-sans-jp)] font-light text-[11px] text-[#999] tracking-[0.5px]">
            {formattedDate}
          </p>
        )}
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/${article.categories.slug}/${article.slug}`} className="flex gap-4 cursor-pointer group">
        <div className="w-[110px] h-[110px] flex-shrink-0 bg-gray-100 overflow-hidden">
          <ImageWithFallback
            src={imageUrl}
            alt={article.media_assets?.altText || article.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <p className="font-[var(--font-noto-sans)] font-normal text-[9px] tracking-[2.5px] uppercase mb-2 text-[#666]">
            {article.categories.name}
          </p>
          <h3 className="font-[var(--font-noto-sans-jp)] font-normal text-[14px] leading-[1.5] mb-2 line-clamp-2 group-hover:opacity-70 transition-opacity">
            {article.title}
          </h3>
          {showDate && formattedDate && (
            <p className="font-[var(--font-noto-sans-jp)] font-light text-[10px] text-[#999] tracking-[0.5px]">
              {formattedDate}
            </p>
          )}
        </div>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/${article.categories.slug}/${article.slug}`} className="group cursor-pointer" style={{ width: '200px', flexShrink: 0 }}>
        <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
          <ImageWithFallback
            src={imageUrl}
            alt={article.media_assets?.altText || article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <p className="font-[var(--font-noto-sans)] font-bold text-[9px] tracking-[1.4px] uppercase mb-1">
          {article.categories.name}
        </p>
        <h3 className="font-[var(--font-noto-sans-jp)] font-medium leading-[1.4] text-[12px] group-hover:underline line-clamp-2 mb-1">
          {article.title}
        </h3>
        {showDate && formattedDate && (
          <p className="font-[var(--font-noto-sans-jp)] font-medium text-[9px] text-[#666]">
            {formattedDate}
          </p>
        )}
      </Link>
    );
  }

  // Default grid variant
  return (
    <Link href={`/${article.categories.slug}/${article.slug}`} className="cursor-pointer group">
      <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-3">
        <ImageWithFallback
          src={imageUrl}
          alt={article.media_assets?.altText || article.title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <p className="font-[var(--font-noto-sans)] font-normal text-[9px] tracking-[2.5px] uppercase mb-2 text-[#666]">
        {article.categories.name}
      </p>
      <h3 className="font-[var(--font-noto-sans-jp)] font-normal leading-[1.5] text-[13px] group-hover:opacity-70 transition-opacity line-clamp-2">
        {article.title}
      </h3>
      {showAuthor && (
        <p className="font-[var(--font-noto-sans)] font-light text-[9px] tracking-[2px] uppercase mt-3 text-[#777]">
          By {article.authors.name}
        </p>
      )}
      {showDate && formattedDate && (
        <p className="font-[var(--font-noto-sans-jp)] font-light text-[10px] text-[#999] mt-1 tracking-[0.5px]">
          {formattedDate}
        </p>
      )}
    </Link>
  );
}
