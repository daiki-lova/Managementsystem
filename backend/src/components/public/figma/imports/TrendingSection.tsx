"use client";

import { ImageWithFallback } from "../ImageWithFallback";

// Image index mapping
const getImage = (index: number) => {
  const images = [
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",  // 0
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop",  // 1
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop",  // 2
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop",  // 3
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop",  // 4
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop",  // 5
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop",  // 6
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=400&fit=crop",  // 7
  ];
  return images[index % images.length];
};

function TrendingCard({ 
  imageIndex, 
  category, 
  title, 
  date,
  left 
}: { 
  imageIndex: number; 
  category: string; 
  title: string; 
  date: string;
  left: string;
}) {
  return (
    <div className={`absolute h-[159.11px] ${left} w-[calc(33.33%-10.67px)] top-[16px]`} data-name="Button">
      <div className="absolute left-0 overflow-clip top-0 w-[135.11px] h-[135.11px]" data-name="Container">
        <div className="absolute aspect-[135.11/135.11] left-0 right-0 top-0" data-name="Picture">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <ImageWithFallback 
              alt="Wellness" 
              className="absolute left-0 max-w-none size-full top-0 object-cover" 
              src={getImage(imageIndex)} 
            />
          </div>
        </div>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] leading-[16px] left-[151.11px] right-[16px] not-italic text-[11.4px] text-black top-[16px] tracking-[1.8px] uppercase">
        <p>{category}</p>
      </div>
      <div className="absolute left-[151.11px] right-[16px] top-[48px]" data-name="Link">
        <div className="flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22.4px] text-[16px] text-black tracking-[-0.229px]">
          <p>{title}</p>
        </div>
      </div>
      <div className="absolute left-[151.11px] right-[16px] top-[118px]" data-name="Container">
        <div className="flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] text-[12px] text-black tracking-[-0.1px] translate-y-[-50%]">
          <p className="leading-[14px]">{date}</p>
        </div>
      </div>
    </div>
  );
}

export function TrendingSection() {
  return (
    <div className="absolute bg-[#f8f8f8] h-[330px] left-0 right-0 top-[1364.03px]" data-name="TrendingBackground">
      <div className="absolute h-[58px] left-[104px] right-[104px] top-[45px]" data-name="Border">
        <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
        <div className="absolute flex flex-col font-['Noto_Sans_JP:DemiLight',sans-serif] font-[350] h-[20px] justify-center leading-[0] left-[calc(50%+0.17px)] text-[18px] text-black text-center top-[27px] tracking-[1.8px] translate-x-[-50%] translate-y-[-50%] uppercase w-[194.021px]">
          <p className="leading-[20px]">TRENDING POST</p>
        </div>
      </div>
      <div className="absolute h-[182px] left-[40px] right-[40px] top-[103px]" data-name="Container">
        <TrendingCard
          imageIndex={5}
          category="WELLNESS"
          title="朝のヨガルーティンで心と体を整える方法"
          date="2025年11月16日"
          left="left-0"
        />
        <TrendingCard
          imageIndex={6}
          category="FITNESS"
          title="初心者向けピラティスの基本エクササイズ"
          date="2025年11月15日"
          left="left-[calc(33.33%+5.33px)]"
        />
        <TrendingCard
          imageIndex={7}
          category="NUTRITION"
          title="運動後の体を回復させる栄養バランス食"
          date="2025年11月14日"
          left="left-[calc(66.67%+10.67px)]"
        />
      </div>
    </div>
  );
}