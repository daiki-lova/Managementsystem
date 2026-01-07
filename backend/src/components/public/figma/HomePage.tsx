"use client";

import { useEffect, useRef, useState } from "react";
import Container89, { Footer } from "./imports/Container";
import SidebarMenu from "./SidebarMenu";
import FixedHeader from "./FixedHeader";
import { ImageWithFallback } from "./ImageWithFallback";
import { PublicArticle, formatDate, getImageUrl, fallbackImages } from "@/lib/use-public-data";

interface HomePageProps {
  onArticleClick: () => void;
  onNavigate: (page: string, category?: string) => void;
  articles?: PublicArticle[];
  loading?: boolean;
}

// 画像URL配列（Container.tsxのgetImageと同じ）
const sportImages = [
  "https://images.unsplash.com/photo-1610562269919-86791081ad29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBwb3NlfGVufDF8fHx8MTc2MzM4ODQ5NHww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBpbGF0ZXMlMjBleGVyY2lzZXxlbnwxfHx8fDE3NjM0MDMzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1525296416200-59aaed194d0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZpdG5lc3MlMjB3b3Jrb3V0fGVufDF8fHx8MTc2MzM5MzUzMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1622206509367-cb16e7f50e69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJ1bm5pbmclMjBzcG9ydHxlbnwxfHx8fDE3NjM0NDU0Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1649888639789-b611bc359d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmV0Y2hpbmclMjBhdGhsZXRpY3xlbnwxfHx8fDE3NjM0NDU0Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMG1lZGl0YXRpb24lMjB3ZWxsbmVzc3xlbnwxfHx8fDE3NjMzMzYwMzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1751456357786-68c278e9063c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGd5bSUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzQ0NTQzOXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1659892603525-cf7845582784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGFjdGl2ZSUyMGxpZmVzdHlsZXxlbnwxfHx8fDE3NjM0NDU0Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1758798471100-a98fc12bc76c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGRhbmNlJTIwZml0bmVzc3xlbnwxfHx8fDE3NjM0MDcxNDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1760551733107-25bd7b041623?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNwb3J0eSUyMGZhc2hpb258ZW58MXx8fHwxNzYzNDQ1NDQwfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1759476530978-07f0eb6906fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGF0aGxldGljJTIwd2VhcnxlbnwxfHx8fDE3NjMzMzAzMTB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1683715697625-b46ce174f92c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGhlYWx0aHklMjBsaWZlc3R5bGV8ZW58MXx8fHwxNzYzNDQ1NDQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1758274525134-4b1e9cc67dbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMG91dGRvb3IlMjBmaXRuZXNzfGVufDF8fHx8MTc2MzQ0NTQ0MXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1622587133988-70349a7942c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBzdHVkaW98ZW58MXx8fHwxNzYzNDQ1NDQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1552196634-24a18d82ac56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGV4ZXJjaXNlJTIwbWF0fGVufDF8fHx8MTc2MzQ0NTQ0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZXRjaHxlbnwxfHx8fDE3NjM0NzIyNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwcG9zdHVyZXxlbnwxfHx8fDE3NjM0NzIyNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1545205597-3d9d02c29597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwYm9keXxlbnwxfHx8fDE3NjM0NzIyNDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1715780463401-b9ef0567943e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwZXhlcmNpc2V8ZW58MXx8fHwxNzYzNDU1ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
];

const getImage = (index: number) => sportImages[index % sportImages.length];

export default function HomePage({ onArticleClick, onNavigate, articles = [], loading = false }: HomePageProps) {
  // APIから取得した記事データを使用
  const getArticleByIndex = (index: number): { title: string; category: string; categorySlug: string; image: string; author: string; date: string; slug: string } => {
    if (articles.length > index) {
      const article = articles[index];
      return {
        title: article.title,
        category: article.categories.name.toUpperCase(),
        categorySlug: article.categories.slug,
        image: getImageUrl(article, index),
        author: `By ${article.authors.name}`,
        date: formatDate(article.publishedAt),
        slug: article.slug,
      };
    }
    // フォールバック
    return {
      title: "読み込み中...",
      category: "LOADING",
      categorySlug: "",
      image: sportImages[index % sportImages.length],
      author: "By RADIANCE",
      date: "",
      slug: "",
    };
  };

  // カテゴリでフィルタリングした記事を取得
  const getArticlesByCategory = (categorySlug: string, limit: number = 5) => {
    return articles
      .filter(a => a.categories.slug.toLowerCase() === categorySlug.toLowerCase())
      .slice(0, limit)
      .map((article, index) => ({
        title: article.title,
        category: `${article.categories.name.toUpperCase()} / ${article.brands?.name?.toUpperCase() || 'WELLNESS'}`,
        image: getImageUrl(article, index),
        author: `By ${article.authors.name}`,
        date: formatDate(article.publishedAt),
        slug: article.slug,
      }));
  };

  // Recent Posts用 - 最新4件（ヒーロー除く）
  const recentPosts = articles.slice(1, 5).map((article, index) => ({
    title: article.title,
    category: `${article.categories.name.toUpperCase()} / NEWS`,
    image: getImageUrl(article, index + 1),
  }));

  // Trending用 - 別の3件
  const trendingPosts = articles.slice(5, 8).map((article, index) => ({
    category: article.categories.name.toUpperCase(),
    title: article.title,
    date: formatDate(article.publishedAt),
    image: getImageUrl(article, index + 5),
  }));
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1680);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const designWidth = 1680;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      setScale(Math.min(1, viewportWidth / designWidth));
      setContainerWidth(Math.min(viewportWidth, designWidth));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const actualHeight = contentRef.current.scrollHeight;
        setContentHeight(actualHeight * scale);
      }
    };
    updateHeight();
    const timer = setTimeout(updateHeight, 100);
    return () => clearTimeout(timer);
  }, [scale]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.closest('[data-name="VOGUE"]')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      const linkItem = target.closest('[data-name*="Item"]');
      if (linkItem) {
        const dataName = linkItem.getAttribute('data-name');
        if (dataName && dataName.includes('Item → Link →')) {
          const category = dataName.split('→').pop()?.trim();
          if (category) {
            e.preventDefault();
            onNavigate('category', category);
            return;
          }
        }
        
        const text = linkItem.textContent?.trim().toLowerCase();
        if (text && ['yoga', 'pilates', 'diet', 'job', 'beauty', 'life', 'sports', 'side business', 'skill', 'more'].includes(text)) {
          e.preventDefault();
          onNavigate('category', text.replace(' ', '-'));
          return;
        }
      }
      
      if (target.closest('[data-name*="Picture"]') || target.closest('[data-name*="Heading"]')) {
        onArticleClick();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onArticleClick, onNavigate]);

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <SidebarMenu onNavigate={onNavigate} scale={scale} />
      <FixedHeader scale={scale} onNavigate={onNavigate} />
      
      {/* デスクトップ版 */}
      <div className="hidden md:block">
        <div
          ref={containerRef}
          className="relative"
          style={{
            width: containerWidth,
            margin: '0 auto',
            height: contentHeight > 0 ? contentHeight : 'auto',
          }}
        >
          <div 
            ref={contentRef}
            className="origin-top-left"
            style={{
              transform: `scale(${scale})`,
              width: designWidth,
            }}
          >
            <div className="relative">
              <style>{`
                .origin-top-left [data-name="Container"] > [data-name="Header"] {
                  display: none !important;
                }
                .origin-top-left [data-name="Link"] > div {
                  height: auto !important;
                  max-height: none !important;
                  white-space: normal !important;
                  overflow: visible !important;
                  display: block !important;
                }
                .origin-top-left [data-name="Link"] p.mb-0,
                .origin-top-left [data-name="Link"] p {
                  display: inline !important;
                  margin: 0 !important;
                  white-space: normal !important;
                  word-wrap: break-word !important;
                  overflow-wrap: break-word !important;
                }
                
                /* 2段階スクロール用のスタイル */
                .two-column-scroll-section {
                  scroll-snap-align: start;
                }
                
                @media (min-width: 768px) {
                  .two-column-scroll-section [data-scroll-section] {
                    will-change: transform;
                  }
                }
              `}</style>
              <Container89 onArticleClick={onArticleClick} />
            </div>
          </div>
        </div>
      </div>

      {/* モバイル版 - PC版と完全に同じデータ */}
      <div className="md:hidden">
        <div className="h-[108px]" />
        
        {/* ヒーローセクション */}
        <div className="px-5 pt-6 pb-8">
          <div className="cursor-pointer" onClick={onArticleClick}>
            <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-3">
              <ImageWithFallback
                alt={getArticleByIndex(0).title}
                className="w-full h-full object-cover"
                src={getArticleByIndex(0).image}
              />
            </div>
            <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[10px] tracking-[1.4px] uppercase mb-2">
              {getArticleByIndex(0).category}
            </p>
            <h1 className="font-['Noto_Sans_JP',sans-serif] font-medium text-[18px] leading-[1.4] mb-3">
              {getArticleByIndex(0).title}
            </h1>
            <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase mb-1">
              {getArticleByIndex(0).author}
            </p>
            <p className="font-['Noto_Sans_JP',sans-serif] font-medium text-[11px] text-[#666]">
              {getArticleByIndex(0).date}
            </p>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="border-t border-[#e0e0e0] px-5 py-8">
          <div className="mb-5">
            <h2 className="font-heading font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[14px] tracking-[1.5px] uppercase">
              Recent Posts
            </h2>
            <div className="h-[2px] w-[40px] bg-black mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(recentPosts.length > 0 ? recentPosts : [
              { title: "読み込み中...", category: "LOADING", image: getImage(1) },
              { title: "読み込み中...", category: "LOADING", image: getImage(2) },
              { title: "読み込み中...", category: "LOADING", image: getImage(3) },
              { title: "読み込み中...", category: "LOADING", image: getImage(4) },
            ]).map((item, index) => (
              <div key={index} className="cursor-pointer group" onClick={onArticleClick}>
                <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                  <ImageWithFallback
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={item.image}
                  />
                </div>
                <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[9px] tracking-[1.4px] uppercase mb-1">
                  {item.category}
                </p>
                <h3 className="font-['Noto_Sans_JP',sans-serif] font-medium leading-[1.4] text-[12px] group-hover:underline line-clamp-2">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Section */}
        <div className="bg-[#f8f8f8] py-8">
          <div className="px-5 mb-5">
            <div className="border-t border-b border-[#e0e0e0] py-4">
              <h2 className="font-['Noto_Sans_JP',sans-serif] font-light text-[14px] tracking-[1.8px] uppercase text-center">
                TRENDING POST
              </h2>
            </div>
          </div>
          <div className="px-5 space-y-4">
            {(trendingPosts.length > 0 ? trendingPosts : [
              { category: "WELLNESS", title: "読み込み中...", date: "", image: getImage(5) },
              { category: "FITNESS", title: "読み込み中...", date: "", image: getImage(16) },
              { category: "NUTRITION", title: "読み込み中...", date: "", image: getImage(17) }
            ]).map((item, index) => (
              <div key={index} className="flex gap-3 cursor-pointer" onClick={onArticleClick}>
                <div className="w-[100px] h-[100px] flex-shrink-0 bg-gray-100 overflow-hidden">
                  <ImageWithFallback alt={item.title} className="w-full h-full object-cover" src={item.image} />
                </div>
                <div className="flex-1">
                  <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[9px] tracking-[1.4px] uppercase mb-1">{item.category}</p>
                  <h3 className="font-['Noto_Sans_JP',sans-serif] font-medium text-[13px] leading-[1.4] mb-2 line-clamp-2">{item.title}</h3>
                  <p className="font-['Noto_Sans_JP',sans-serif] font-medium text-[10px] text-[#666]">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YOGAセクション */}
        <MobileCategorySection
          title="YOGA"
          mainArticle={(() => {
            const yogaArticles = getArticlesByCategory('yoga');
            return yogaArticles[0] || {
              title: "ヨガ＆ピラティスで理想のライフスタイルを手に入れる",
              category: "YOGA / WELLNESS",
              image: getImage(8),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const yogaArticles = getArticlesByCategory('yoga');
            return yogaArticles.slice(1, 5).length > 0 ? yogaArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "YOGA", image: getImage(9), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'yoga')}
          topMargin={true}
        />

        {/* PILATESセクション */}
        <MobileCategorySection
          title="PILATES"
          mainArticle={(() => {
            const pilatesArticles = getArticlesByCategory('pilates');
            return pilatesArticles[0] || {
              title: "ピラティスで美しい姿勢とスタイルを手に入れる",
              category: "PILATES / FITNESS",
              image: getImage(1),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const pilatesArticles = getArticlesByCategory('pilates');
            return pilatesArticles.slice(1, 5).length > 0 ? pilatesArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "PILATES", image: getImage(16), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'pilates')}
        />

        {/* DIETセクション */}
        <MobileCategorySection
          title="DIET"
          mainArticle={(() => {
            const dietArticles = getArticlesByCategory('diet');
            return dietArticles[0] || {
              title: "バランスの取れた食事で内側から輝く美しさを",
              category: "DIET / NUTRITION",
              image: getImage(11),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const dietArticles = getArticlesByCategory('diet');
            return dietArticles.slice(1, 5).length > 0 ? dietArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "DIET", image: getImage(17), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'diet')}
        />

        {/* WELLNESSセクション（JOBの代わり） */}
        <MobileCategorySection
          title="WELLNESS"
          mainArticle={(() => {
            const wellnessArticles = getArticlesByCategory('wellness');
            return wellnessArticles[0] || {
              title: "心と体を整えるウェルネスライフ",
              category: "WELLNESS / LIFESTYLE",
              image: getImage(6),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const wellnessArticles = getArticlesByCategory('wellness');
            return wellnessArticles.slice(1, 5).length > 0 ? wellnessArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "WELLNESS", image: getImage(7), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'wellness')}
        />

        {/* FITNESSセクション（BEAUTYの代わり） */}
        <MobileCategorySection
          title="FITNESS"
          mainArticle={(() => {
            const fitnessArticles = getArticlesByCategory('fitness');
            return fitnessArticles[0] || {
              title: "効果的なフィットネスルーティン",
              category: "FITNESS / TRAINING",
              image: getImage(5),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const fitnessArticles = getArticlesByCategory('fitness');
            return fitnessArticles.slice(1, 5).length > 0 ? fitnessArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "FITNESS", image: getImage(6), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'fitness')}
        />

        {/* LIFEセクション */}
        <MobileCategorySection
          title="LIFE"
          mainArticle={(() => {
            const lifeArticles = getArticlesByCategory('life');
            return lifeArticles[0] || {
              title: "心地よい暮らしのヒント──日々を豊かにする習慣",
              category: "LIFE / LIFESTYLE",
              image: getImage(13),
              author: "By RADIANCE TEAM",
              date: ""
            };
          })()}
          articles={(() => {
            const lifeArticles = getArticlesByCategory('life');
            return lifeArticles.slice(1, 5).length > 0 ? lifeArticles.slice(1, 5) : [
              { title: "読み込み中...", category: "LIFE", image: getImage(14), author: "By RADIANCE", date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'life')}
        />

        {/* SPORTSセクション（カルーセル） */}
        <MobileCarouselSection
          title="SPORTS"
          articles={(() => {
            const sportsArticles = getArticlesByCategory('sports');
            return sportsArticles.length > 0 ? sportsArticles.map(a => ({
              title: a.title,
              category: "SPORTS",
              image: a.image,
              date: a.date
            })) : [
              { title: "読み込み中...", category: "SPORTS", image: getImage(3), date: "" }
            ];
          })()}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'sports')}
        />

        {/* 全記事セクション（カルーセル） */}
        <MobileCarouselSection
          title="ALL ARTICLES"
          articles={articles.slice(8, 12).map((article, index) => ({
            title: article.title,
            category: article.categories.name.toUpperCase(),
            image: getImageUrl(article, index + 8),
            date: formatDate(article.publishedAt)
          }))}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'all')}
        />

        {/* おすすめ記事セクション（カルーセル） */}
        <MobileCarouselSection
          title="RECOMMENDED"
          articles={articles.slice(12, 17).map((article, index) => ({
            title: article.title,
            category: article.categories.name.toUpperCase(),
            image: getImageUrl(article, index + 12),
            date: formatDate(article.publishedAt)
          }))}
          onArticleClick={onArticleClick}
          onViewMore={() => onNavigate('category', 'recommended')}
        />

        {/* モバイル版フッター */}
        <Footer />
      </div>
    </div>
  );
}

// モバイル用カテゴリーセクションコンポーネント
function MobileCategorySection({ 
  title, 
  mainArticle,
  articles, 
  onArticleClick, 
  onViewMore,
  topMargin = false
}: { 
  title: string;
  mainArticle: { title: string; category: string; image: string; author: string; date: string };
  articles: Array<{ title: string; category: string; image: string; author: string; date: string }>; 
  onArticleClick: () => void;
  onViewMore: () => void;
  topMargin?: boolean;
}) {
  return (
    <div className={`border-t border-[#e0e0e0] px-5 py-8 ${topMargin ? 'mt-20' : ''}`}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[14px] tracking-[1.5px] uppercase">
            {title}
          </h2>
          <div className="h-[2px] w-[40px] bg-black mt-2" />
        </div>
        <button 
          onClick={onViewMore}
          className="font-heading font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase underline hover:opacity-70"
        >
          More
        </button>
      </div>

      <div className="cursor-pointer group mb-6" onClick={onArticleClick}>
        <div className="aspect-[4/5] overflow-hidden bg-gray-100 mb-3">
          <ImageWithFallback 
            alt={mainArticle.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            src={mainArticle.image} 
          />
        </div>
        <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[10px] tracking-[1.4px] uppercase mb-2">
          {mainArticle.category}
        </p>
        <h3 className="font-['Noto_Sans_JP',sans-serif] font-medium text-[15px] leading-[1.4] group-hover:underline mb-2">
          {mainArticle.title}
        </h3>
        <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[9px] tracking-[1.2px] uppercase mb-1">
          {mainArticle.author}
        </p>
        <p className="font-['Noto_Sans_JP',sans-serif] font-medium text-[10px] text-[#666]">
          {mainArticle.date}
        </p>
      </div>

      <div className="space-y-4">
        {articles.map((article, index) => (
          <div key={index} className="cursor-pointer group flex gap-3" onClick={onArticleClick}>
            <div className="w-[100px] h-[100px] flex-shrink-0 overflow-hidden bg-gray-100">
              <ImageWithFallback 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                src={article.image} 
              />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[9px] tracking-[1.4px] uppercase mb-1">
                {article.category}
              </p>
              <h3 className="font-['Noto_Sans_JP',sans-serif] font-medium leading-[1.4] text-[13px] group-hover:underline line-clamp-2 mb-1">
                {article.title}
              </h3>
              <p className="font-['Noto_Sans_JP',sans-serif] font-medium text-[9px] text-[#666]">
                {article.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// モバイル用カルーセルセクションコンポーネント
function MobileCarouselSection({ 
  title, 
  articles, 
  onArticleClick, 
  onViewMore
}: { 
  title: string;
  articles: Array<{ title: string; category: string; image: string; date: string }>; 
  onArticleClick: () => void;
  onViewMore: () => void;
}) {
  return (
    <div className="border-t border-[#e0e0e0] py-8">
      <div className="px-5 mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[14px] tracking-[1.5px] uppercase">
            {title}
          </h2>
          <div className="h-[2px] w-[40px] bg-black mt-2" />
        </div>
        <button 
          onClick={onViewMore}
          className="font-heading font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[10px] tracking-[1.2px] uppercase underline hover:opacity-70">
          More
        </button>
      </div>

      <div className="overflow-x-auto pl-5">
        <div className="flex gap-4 pb-4 pr-5" style={{ width: 'max-content' }}>
          {articles.map((article, index) => (
            <div key={index} className="cursor-pointer group" onClick={onArticleClick} style={{ width: '200px', flexShrink: 0 }}>
              <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                <ImageWithFallback 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  src={article.image} 
                />
              </div>
              <p className="font-['Noto_Sans_CJK_JP',sans-serif] font-bold text-[9px] tracking-[1.4px] uppercase mb-1">
                {article.category}
              </p>
              <h3 className="font-['Noto_Sans_JP',sans-serif] font-medium leading-[1.4] text-[12px] group-hover:underline line-clamp-2 mb-1">
                {article.title}
              </h3>
              <p className="font-['Noto_Sans_JP',sans-serif] font-medium text-[9px] text-[#666]">
                {article.date}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}