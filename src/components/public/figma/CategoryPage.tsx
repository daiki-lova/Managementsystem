"use client";

import { useEffect, useState, useRef } from "react";
import SidebarMenu from "./SidebarMenu";
import FixedHeader from "./FixedHeader";
import { Footer } from "./imports/Container";
import { ImageWithFallback } from "./ImageWithFallback";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryPageProps {
  category: string;
  onNavigate: (page: string, category?: string) => void;
}

// 画像インデックスを取得する関数
const getImage = (index: number) => {
  const images = [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwbWVkaXRhdGlvbnxlbnwxfHx8fDE3NjM0NzIyNDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1715780463401-b9ef0567943e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwZXhlcmNpc2V8ZW58MXx8fHwxNzYzNDU1ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1620882133512-5149956b1261?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZGlldCUyMGZvb2R8ZW58MXx8fHwxNzYzNTE0OTczfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1554200876-2b37eac20913?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdvcmtpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzYzNTE0OTc0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1683408640631-2c99fff964d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBza2luY2FyZXxlbnwxfHx8fDE3NjM1MDc3NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1610060616036-09bd2c69e8d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWZlc3R5bGUlMjB3ZWxsbmVzc3xlbnwxfHx8fDE3NjM0NDM0OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1645238426817-8c3e7d1396cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJ1bm5pbmclMjBmaXRuZXNzfGVufDF8fHx8MTc2MzQ0NDc0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nfGVufDF8fHx8MTc2MzQ2MjAxM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1659415221439-b75fb3d97bff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjeWNsaW5nJTIwc3BvcnR8ZW58MXx8fHwxNzYzNTE0OTc2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1558617320-e695f0d420de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2ltbWluZyUyMHBvb2x8ZW58MXx8fHwxNzYzNDg2NjE3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1507919909716-c8262e491cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVlbGFuY2UlMjB3b3JraW5nfGVufDF8fHx8MTc2MzUxNDk3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/39/lIZrwvbeRuuzqOoWJUEn_Photoaday_CSD%20%281%20of%201%29-5.jpg?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdWx0aW5nJTIwYnVzaW5lc3N8ZW58MXx8fHwxNzYzNDU0OTY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wfGVufDF8fHx8MTc2MzUxNDk3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1523540939399-141cbff6a8d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnZlc3RtZW50JTIwZmluYW5jZXxlbnwxfHx8fDE3NjM0NDUxNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1565229284535-2cbbe3049123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZ3xlbnwxfHx8fDE3NjM0MjgyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1626785774573-4b799315345d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWdufGVufDF8fHx8MTc2MzUxNDcyOXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1557838923-2985c318be48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbWFya2V0aW5nfGVufDF8fHx8MTc2MzQyMTgzMXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzYzNTE0OTc5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1607909599990-e2c4778e546b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZXRjaGluZ3xlbnwxfHx8fDE3NjM0MzMyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1747239685045-fcbcf98985db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwcmVmb3JtZXJ8ZW58MXx8fHwxNzYzNDUyNzk4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1627308594190-a057cd4bfac8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwYnJlYWtmYXN0fGVufDF8fHx8MTc2MzUxNDk4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1586227740560-8cf2732c1531?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW1vdGUlMjB3b3JrfGVufDF8fHx8MTc2MzUxNDk4MHww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYWNpYWwlMjB0cmVhdG1lbnR8ZW58MXx8fHwxNzYzNDY5NzYyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwZGVjb3J8ZW58MXx8fHwxNzYzNDU0NjE1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  ];
  
  return images[index % images.length];
};

// 記事カード（4カラム用）
function ArticleCard({ index, category, onClick }: { index: number; category: string; onClick: () => void }) {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      <div className="aspect-square w-full overflow-hidden">
        <ImageWithFallback 
          alt={`${category} article`} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          src={getImage(index)} 
        />
      </div>
      <div className="mt-4">
        <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] not-italic text-[11.8px] text-black tracking-[1.8px] uppercase">
          <p className="leading-[16px]">{category}</p>
        </div>
        <div className="h-[66px] mt-4">
          <div className="font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] text-[18px] text-black tracking-[-0.225px]">
            <p className="mb-0">心と体を整える──{category}で理想のライフスタイルを手に入れる</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.964px] uppercase">
            <p className="leading-[16.36px] tracking-[0.05em]">By ALIGN TEAM</p>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] text-[12px] text-black tracking-[-0.1px]">
            <p className="leading-[14px]">2025年11月18日</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage({ category, onNavigate }: CategoryPageProps) {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1680);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const designWidth = 1680;
  const itemsPerPage = 16; // 4×4グリッド
  const totalItems = 48; // 全48記事（3ページ分）
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

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

  // コンテンツの実際の高さを測定
  useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const actualHeight = contentRef.current.scrollHeight;
        setContentHeight(actualHeight * scale);
      }
    };
    
    // 初回測定
    updateHeight();
    
    // スケール変更時やリサイズ時に再測定
    const timer = setTimeout(updateHeight, 100);
    
    return () => clearTimeout(timer);
  }, [scale, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 現在のページの記事を生成
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentArticles = Array.from({ length: itemsPerPage }, (_, i) => ({
    index: startIndex + i,
    category: category || "WELLNESS"
  }));

  return (
    <div className="w-full bg-white overflow-x-hidden">
      <SidebarMenu onNavigate={onNavigate} scale={scale} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <FixedHeader scale={scale} onNavigate={onNavigate} onToggleMenu={() => setMenuOpen(!menuOpen)} />
      
      {/* デスクトップ・タブレット版（768px以上） */}
      <div
        ref={containerRef}
        className="relative hidden md:block"
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
          {/* ヘッダースペース */}
          <div className="h-[160px]" />
          
          {/* メインコンテンツ */}
          <div className="px-[104px] py-[100px]">
            {/* カテゴリータイトル */}
            <div className="mb-[80px]">
              <h1 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[48px] tracking-[2px] uppercase">
                {category || "ALL TOPICS"}
              </h1>
              <div className="h-[4px] w-[120px] bg-black mt-[24px]" />
            </div>

            {/* 4×4グリッド */}
            <div className="grid grid-cols-4 gap-x-[32px] gap-y-[80px]">
              {currentArticles.map((article, i) => (
                <ArticleCard 
                  key={i} 
                  index={article.index} 
                  category={article.category} 
                  onClick={() => onNavigate("article")}
                />
              ))}
            </div>

            {/* ページネーション */}
            <div className="flex items-center justify-center gap-4 mt-[120px] mb-[120px]">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 flex items-center justify-center border font-['Noto_Sans_JP:Medium',sans-serif] transition-colors ${
                      currentPage === page
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* フッター - デスクトップ版（scale領域外で横100%） */}
      <div className="w-full hidden md:block">
        <Footer />
      </div>

      {/* モバイル版（768px未満） */}
      <div className="md:hidden">
        {/* ヘッダースペース */}
        <div className="h-[108px]" />
        
        {/* メインコンテンツ */}
        <div className="px-5 py-8">
          {/* カテゴリータイトル */}
          <div className="mb-8">
            <h1 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] tracking-[1.5px] uppercase">
              {category || "ALL TOPICS"}
            </h1>
            <div className="h-[3px] w-[60px] bg-black mt-3" />
          </div>

          {/* 2カラムグリッド */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
            {currentArticles.map((article, i) => (
              <div key={i} className="flex flex-col cursor-pointer group" onClick={() => onNavigate("article")}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback 
                    alt={`${article.category} article`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    src={getImage(article.index)} 
                  />
                </div>
                <div className="mt-3">
                  <p className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[9px] tracking-[1.4px] uppercase mb-2">
                    {article.category}
                  </p>
                  <h2 className="font-['Noto_Sans_JP:Medium',sans-serif] leading-[1.4] text-[13px] text-black group-hover:underline line-clamp-3">
                    心と体を整える──{article.category}で理想のライフスタイルを手に入れる
                  </h2>
                  <p className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[9px] tracking-[1.2px] uppercase mt-2">
                    By ALIGN TEAM
                  </p>
                  <p className="font-['Noto_Sans_JP:Medium',sans-serif] text-[10px] text-[#666] mt-1">
                    2025年11月18日
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-center gap-3 mt-12 mb-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 flex items-center justify-center border font-['Noto_Sans_JP:Medium',sans-serif] text-[13px] transition-colors ${
                    currentPage === page
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* フッター */}
        <Footer />
      </div>
    </div>
  );
}