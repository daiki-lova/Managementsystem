"use client";

import { useState, useEffect } from "react";
import svgPaths from "./imports/svg-ybzm8jfd1u";
const logoImage = "/assets/figma/06f4adffe49b0a36b61963a4e566c246724ea150.png";

interface FixedHeaderProps {
  scale: number;
  onNavigate: (page: string, category?: string) => void;
}

export default function FixedHeader({ scale, onNavigate }: FixedHeaderProps) {
  const designWidth = 1680;
  const [containerWidth, setContainerWidth] = useState(designWidth);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(Math.min(window.innerWidth, designWidth));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <>
      {/* デスクトップ・タブレット用ヘッダー（768px以上） */}
      <div
        className="fixed top-0 left-0 right-0 z-[100] hidden md:block w-full"
        data-name="FixedHeaderWrapper"
      >
        <div
          className="mx-auto"
          style={{ width: containerWidth }}
        >
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${scale})`,
              width: designWidth,
              transformOrigin: 'top left',
            }}
          >
            <div className="absolute h-[50px] left-0 top-0 w-[1680px]">
              <div className="absolute bg-white h-[160px] left-0 right-0 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] top-[calc(50%+55px)] translate-y-[-50%]">
                <div className="absolute h-[112px] left-0 right-[0.02px] top-0">
                  <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
                  <div className="absolute inset-[21px_688px_21px_687.98px]" data-name="Link">
                    <div 
                      className="absolute h-[70px] left-1/2 overflow-clip top-0 translate-x-[-50%] w-[300px] cursor-pointer" 
                      data-name="VOGUE"
                      onClick={() => {
                        onNavigate('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute h-[70px] left-0 overflow-clip top-0 w-[300px] flex flex-col items-center justify-center" data-name="logo.svg fill">
                        <img src={logoImage} alt="Radiance Logo" className="h-[50px] w-auto mb-1" />
                        <p className="text-black text-[9px] tracking-[1px] whitespace-nowrap">心と体を輝かせるライフスタイルマガジン</p>
                      </div>
                    </div>
                  </div>
                  {/* ハンバーガーメニューアイコン */}
                  <div className="absolute bottom-0 left-0 right-[1615.98px] top-0" data-name="Button">
                    <div className="absolute left-[24px] size-[16px] top-[48px]" data-name="SVG">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                        <g id="SVG">
                          <path clipRule="evenodd" d={svgPaths.p30fe3300} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="absolute h-[48px] left-[calc(50%-0.01px)] overflow-clip top-[112px] translate-x-[-50%] w-[674.77px]" data-name="Container">
                  <div className="absolute h-[14.77px] left-0 top-[16.61px] right-0 flex items-center justify-between gap-3" data-name="Nav - Primary → List">
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'yoga')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">YOGA</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'pilates')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">PILATES</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'diet')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">DIET</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'job')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">JOB</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'beauty')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">BEAUTY</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'life')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">LIFE</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'sports')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">SPORTS</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'side-business')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase whitespace-nowrap">
                        <p className="leading-[14.77px]">SIDE BUSINESS</p>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-opacity" 
                      data-name="Item → Link"
                      onClick={() => onNavigate('category', 'skills')}
                    >
                      <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.662px] uppercase">
                        <p className="leading-[14.77px]">SKILLS</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モバイル用ヘッダー（768px未満） */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm md:hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#e0e0e0]">
          <div className="w-6 h-6">
            <svg className="w-full h-full" fill="none" viewBox="0 0 16 16">
              <path clipRule="evenodd" d={svgPaths.p30fe3300} fill="black" fillRule="evenodd" />
            </svg>
          </div>
          
          <div 
            className="cursor-pointer"
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img src={logoImage} alt="Radiance Logo" className="h-8 w-auto" />
          </div>
          
          <div className="w-6" />
        </div>
        
        {/* モバイルナビゲーション - 横スクロール */}
        <div className="overflow-x-auto border-b border-[#e0e0e0] bg-white">
          <div className="flex gap-4 px-4 py-3 whitespace-nowrap min-w-max">
            {['YOGA', 'PILATES', 'DIET', 'JOB', 'BEAUTY', 'LIFE', 'SPORTS', 'SIDE BUSINESS', 'SKILLS'].map((item) => (
              <button
                key={item}
                onClick={() => onNavigate('category', item.toLowerCase().replace(' ', '-'))}
                className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[10px] tracking-[1.2px] uppercase hover:opacity-70 transition-opacity"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}