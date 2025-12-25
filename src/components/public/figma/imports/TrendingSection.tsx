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
    <div className={`absolute h-[159.11px] ${left} w-[calc(33.33%-10.67px)] top-[16px] group cursor-pointer`} data-name="Button">
      <div className="absolute left-0 overflow-clip top-0 w-[135.11px] h-[135.11px]" data-name="Container">
        <div className="absolute aspect-[135.11/135.11] left-0 right-0 top-0" data-name="Picture">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <ImageWithFallback
              alt="Wellness"
              className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-[1.02] transition-transform duration-500"
              src={getImage(imageIndex)}
            />
          </div>
        </div>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans:Regular',sans-serif] leading-[16px] left-[151.11px] right-[16px] not-italic text-[10px] text-[#555] top-[16px] tracking-[3px] uppercase">
        <p>{category}</p>
      </div>
      <div className="absolute left-[151.11px] right-[16px] top-[44px]" data-name="Link">
        <div className="flex flex-col font-['Noto_Sans_JP:Regular',sans-serif] font-normal leading-[1.5] text-[15px] text-black tracking-[0.3px] group-hover:opacity-70 transition-opacity">
          <p className="line-clamp-2">{title}</p>
        </div>
      </div>
      <div className="absolute left-[151.11px] right-[16px] top-[118px]" data-name="Container">
        <div className="flex flex-col font-['Noto_Sans_JP:Light',sans-serif] font-light h-[14px] justify-center leading-[0] text-[11px] text-[#999] tracking-[0.5px] translate-y-[-50%]">
          <p className="leading-[14px]">{date}</p>
        </div>
      </div>
    </div>
  );
}

export function TrendingSection() {
  return (
    <div className="absolute bg-[#fafafa] h-[330px] left-0 right-0 top-[1364.03px]" data-name="TrendingBackground">
      <div className="absolute h-[58px] left-[104px] right-[104px] top-[45px]" data-name="Border">
        <div aria-hidden="true" className="absolute border-[#e5e5e5] border-[1px_0px] border-solid inset-0 pointer-events-none" />
        <div className="absolute flex flex-col font-['Noto_Sans:Light',sans-serif] font-light h-[20px] justify-center leading-[0] left-[calc(50%+0.17px)] text-[13px] text-black text-center top-[27px] tracking-[4px] translate-x-[-50%] translate-y-[-50%] uppercase w-auto">
          <p className="leading-[20px]">Trending</p>
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