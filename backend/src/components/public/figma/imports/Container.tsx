"use client";

import svgPaths from "./svg-ybzm8jfd1u";
import { ImageWithFallback } from "../ImageWithFallback";
const logoImage = "/assets/figma/917eb3a33258754379746bcc4d875061f4d7fbfe.png";
const footerLogoImage = "/assets/figma/17e8fd9b7ed5958fec1ad2e3f9bee7879aaa05d4.png";
import { TrendingSection } from "./TrendingSection";
import { PicturefabFiveNew, Link3New, Container3New, Picture5New, Link4New, Container4New } from "./RecentPostsComponents";
import { useRef, useEffect, useState } from "react";

interface ContainerProps {
  onArticleClick?: () => void;
}

// スポーティな女性の画像URL
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
];

// 画像をローテーションで使用するためのヘルパー関数
const getImage = (index: number) => sportImages[index % sportImages.length];

function Border() {
  return (
    <div className="absolute h-[100px] left-[64px] right-[64px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" style={{ height: '50px' }} />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-0 not-italic text-[21px] text-black top-[25px] tracking-[2.1px] translate-y-[-50%] uppercase w-auto whitespace-nowrap">
        <p className="leading-[24px]">RECENT POSTS</p>
      </div>
    </div>
  );
}

function Picture5vogueWorld() {
  return (
    <div className="absolute h-[960px] left-0 top-0 w-[720px]" data-name="Picture → ウェルネス＆フィットネス特集">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman practicing yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(0)} />
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="absolute h-[80px] left-0 right-0 top-[999.98px]" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[42px] left-0 text-[33px] text-black top-[40px] translate-y-[-50%] w-[720px] overflow-hidden">
        <p className="mb-0 line-clamp-2">心と体を整える──ヨガ＆ピラティスで理想のライフスタイルを手に入れる</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[1095.98px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase overflow-hidden text-ellipsis">
        <p className="leading-[16.36px]">By VOGUE</p>
      </div>
    </div>
  );
}

function Button({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="absolute h-[1130.34px] left-[440px] right-[440px] top-[93.69px] max-md:col-span-2 max-md:relative max-md:h-auto max-md:left-0 max-md:right-0 max-md:top-0 cursor-pointer hover:opacity-90 transition-opacity" data-name="Button">
      <Picture5vogueWorld />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[983.98px] tracking-[1.8px] translate-y-[-50%] uppercase w-[720px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link />
      <Container />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[1123.34px] tracking-[-0.1px] translate-y-[-50%] max-md:relative max-md:top-0 max-md:translate-y-0">
        <p className="leading-[14px] whitespace-nowrap">2025年11月13日</p>
      </div>
    </div>
  );
}

function Pictureshogun() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → ピラティスで体幹を強化! 美しい姿勢とスタイルを手に入れる">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman practicing pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(1)} />
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] overflow-hidden">
        <p className="line-clamp-2">ピラティスで体幹を強化! 美しい姿勢とスタイルを手に入れる</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px]">
        <p className="leading-[16.36px] tracking-[0.05em]">By SAORI NAKADOZONO</p>
      </div>
    </div>
  );
}

function Button1({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="absolute h-[540.36px] left-[64px] right-[1192px] top-[93.69px] max-md:relative max-md:h-auto max-md:left-0 max-md:right-0 max-md:top-0 cursor-pointer hover:opacity-90 transition-opacity" data-name="Button">
      <Pictureshogun />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">FITNESS / NEWS</p>
      </div>
      <Link1 />
      <Container1 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Picture26() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → フィットネスウェアの最新トレンド── 機能性とスタイルを兼ね備えた選び方">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman in athletic wear" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(2)} />
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] overflow-hidden">
        <p className="line-clamp-2">フィットネスウェアの最新トレンド── 機能性とスタイルを兼ね備えた選び方</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px]">
        <p className="leading-[16.36px] tracking-[0.05em]">By Renata Joffre</p>
      </div>
    </div>
  );
}

function Button2({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="absolute h-[540.36px] left-[64px] right-[1192px] top-[685.86px] max-md:relative max-md:h-auto max-md:left-0 max-md:right-0 max-md:top-0 cursor-pointer hover:opacity-90 transition-opacity" data-name="Button">
      <Picture26 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link2 />
      <Container2 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function PicturefabFive() {
  return (
    <div className="absolute left-0 size-[344px] top-0" data-name="Picture → 「ブルースのステージを再現するために“限界”に挑んだ」──ジェレミー・���レン・ホワイトの覚悟【FAB FIVE】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(3)} />
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[344px] overflow-hidden">
        <p className="mb-0">「ブルースのステージを再現するために“限</p>
        <p className="mb-0">界”に挑んだ」──ジェレミー・アレン・ホワ</p>
        <p>イトの覚悟【FAB FIVE】</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[344px] overflow-hidden text-ellipsis">
        <p className="leading-[16.36px] text-[11.8px]">
          By HIROAKI SAITO<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>YAKA MATSUMOTO
        </p>
      </div>
    </div>
  );
}

function Button3({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="absolute h-[560.17px] left-[1192px] right-[64px] top-[93.69px] max-md:relative max-md:h-auto max-md:left-0 max-md:right-0 max-md:top-0 cursor-pointer hover:opacity-90 transition-opacity" data-name="Button">
      <PicturefabFiveNew />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[344px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">YOGA / WELLNESS</p>
      </div>
      <Link3New />
      <Container3New />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[493.36px] tracking-[-0.1px] translate-y-[-50%] w-[344px] max-md:relative max-md:top-0 max-md:translate-y-0">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Picture5() {
  return (
    <div className="absolute left-0 size-[344px] top-0" data-name="Picture → 髪のパサつき＆頭皮の乾燥対策に導入したい保湿“シャントリ”5選">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(4)} />
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[0.675px] translate-y-[-50%] w-[344px] overflow-hidden">
        <p className="mb-0">髪のパサつき＆���皮の乾燥対策に導入した</p>
        <p>い保湿“シャントリ”5選</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[444px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[344px] overflow-hidden text-ellipsis">
        <p className="leading-[16.36px]">
          By MANAMI REN<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>MAKIKO YOSHIDA
        </p>
      </div>
    </div>
  );
}

function Button4({ onClick }: { onClick?: () => void }) {
  return (
    <div onClick={onClick} className="absolute h-[538.17px] left-[1192px] right-[64px] top-[685.86px] max-md:relative max-md:h-auto max-md:left-0 max-md:right-0 max-md:top-0 cursor-pointer hover:opacity-90 transition-opacity" data-name="Button">
      <Picture5New />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.6px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[344px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">FITNESS / WELLNESS</p>
      </div>
      <Link4New />
      <Container4New />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[471.36px] tracking-[-0.1px] translate-y-[-50%] w-[344px] max-md:relative max-md:top-0 max-md:translate-y-0">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute h-[1244.03px] left-[40px] right-[40px] top-[24px] max-md:!relative max-md:!h-auto max-md:!left-0 max-md:!right-0 max-md:px-[20px] max-md:!top-0 max-md:mb-20" data-name="Container">
      <Border />
      <div className="md:contents max-md:grid max-md:grid-cols-2 max-md:gap-[16px] max-md:mt-20">
        <Button />
        <Button1 />
        <Button2 />
        <Button3 />
        <Button4 />
      </div>
    </div>
  );
}

function Border1() {
  return (
    <div className="absolute h-[58px] left-[104px] right-[104px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:DemiLight',sans-serif] font-[350] h-[20px] justify-center leading-[0] left-[calc(50%+0.17px)] text-[18px] text-black text-center top-[27px] tracking-[1.8px] translate-x-[-50%] translate-y-[-50%] uppercase w-[194.021px]">
        <p className="leading-[20px]">TRENDING POST</p>
      </div>
    </div>
  );
}

function Container6() {
  return <div className="absolute h-[135.11px] left-0 right-[334.22px] top-0" data-name="Container" />;
}

function Picture() {
  return (
    <div className="absolute aspect-[135.11/135.11] left-0 right-0 top-0" data-name="Picture → フラットブーツにさよなら──この秋冬は万能な“キトゥンヒール”にも注目を">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(5)} />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute left-0 overflow-clip top-0 w-[135.11px] h-[135.11px]" data-name="Container">
      <Picture />
    </div>
  );
}

function Link5() {
  return (
    <div className="absolute left-[151.11px] right-0 top-[48px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22.4px] left-0 text-[16px] text-black top-0 tracking-[-0.229px] max-w-[398px]">
        <p className="mb-0">フラットブーツに��よなら──この秋冬は万</p>
        <p>能な“キトゥンヒール”にも注目を</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute left-[151.11px] right-0 top-[118px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] leading-[16.36px] left-0 not-italic text-[11.4px] text-black top-0 tracking-[1.964px] uppercase max-w-[398px]">
        <p>By Nuala Phillips</p>
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute h-[159.11px] left-[64px] right-[1066.67px] top-[16px]" data-name="Button">
      <Container6 />
      <Container7 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] leading-[16px] left-[151.11px] not-italic text-[11.4px] text-black top-[16px] tracking-[1.8px] uppercase max-w-[398px]">
        <p>{`Trend&Story`}</p>
      </div>
      <Link5 />
      <Container8 />
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute bottom-0 left-0 right-[1615.98px] top-0" data-name="Button">
      <div className="absolute left-[24px] size-[16px] top-[48px]" data-name="SVG">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <g id="SVG">
            <path clipRule="evenodd" d={svgPaths.p30fe3300} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Picture6() {
  return (
    <div className="absolute h-[14.77px] left-[249.33px] top-1/2 translate-y-[-50%] w-[71.59px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[71.79px]">
        <p className="leading-[14.77px]">Lifestyle</p>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="absolute h-[14.77px] left-0 right-0 top-0" data-name="Link - Opens in a new window">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[#1f1f1f] text-[13px] top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[176.01px]">
        <p className="leading-[14.77px]">{`Magazine & Members`}</p>
      </div>
    </div>
  );
}

function Link6() {
  return (
    <div className="absolute left-[151.11px] right-0 top-[48px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22.4px] left-0 text-[16px] text-black top-0 tracking-[-0.229px] max-w-[398px]">
        <p className="mb-0">ロンドンのストリートを席巻中。この秋、“シガ</p>
        <p className="mb-0">レットジーンズ”をモダンに着こなす5つのヒ</p>
        <p>ント</p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="absolute left-[151.11px] right-0 top-[118px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] leading-[16.36px] left-0 not-italic text-[12px] text-black top-0 tracking-[1.964px] uppercase max-w-[398px]">
        <p>By Daisy Jones</p>
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute h-[50px] left-0 top-0 w-[1680px]" data-name="Container">
      <div className="absolute bg-white h-[160px] left-0 right-0 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] top-[calc(50%+55px)] translate-y-[-50%]" data-name="Header">
        <div className="absolute h-[112px] left-0 right-[0.02px] top-0" data-name="HorizontalBorder">
          <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
          <div className="absolute inset-[21px_688px_21px_687.98px]" data-name="Link">
            <div className="absolute h-[70px] left-1/2 overflow-clip top-0 translate-x-[-50%] w-[300px]" data-name="Picture → Vogue Japan">
              <div className="absolute h-[70px] left-0 overflow-clip top-0 w-[300px] flex items-center justify-center" data-name="logo.svg fill">
                <img src={logoImage} alt="Radiance Logo" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <Container9 />
          <div className="absolute h-[14.77px] left-[1488.17px] right-0 top-[40px]" data-name="Container">
            <Container10 />
          </div>
        </div>
        <div className="absolute h-[48px] left-[calc(50%-0.01px)] overflow-clip top-[112px] translate-x-[-50%] w-[674.77px]" data-name="Container">
          <div className="absolute h-[14.77px] left-0 top-[16.61px] w-[674.77px]" data-name="Nav - Primary → List">
            <div className="absolute h-[14.77px] left-0 top-1/2 translate-y-[-50%] w-[66.58px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[12.8px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[66.78px]">
                <p className="leading-[14.77px]">Fashion</p>
              </div>
            </div>
            <div className="absolute h-[14.77px] left-[82.58px] top-1/2 translate-y-[-50%] w-[56.17px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[12.4px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[56.37px]">
                <p className="leading-[14.77px]">Beauty</p>
              </div>
            </div>
            <div className="absolute h-[14.77px] left-[154.75px] top-1/2 translate-y-[-50%] w-[78.58px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[12.2px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[78.78px]">
                <p className="leading-[14.77px]">Celebrity</p>
              </div>
            </div>
            <Picture6 />
            <div className="absolute h-[14.77px] left-[336.92px] top-1/2 translate-y-[-50%] w-[63.52px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[12.8px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[63.72px]">
                <p className="leading-[14.77px]">Runway</p>
              </div>
            </div>
            <div className="absolute h-[14.77px] left-[416.44px] top-1/2 translate-y-[-50%] w-[97.73px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[13px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[97.93px]">
                <p className="leading-[14.77px]">Horoscope</p>
              </div>
            </div>
            <div className="absolute h-[14.77px] left-[530.17px] top-1/2 translate-y-[-50%] w-[48.41px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[13px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[48.61px]">
                <p className="leading-[14.77px]">Video</p>
              </div>
            </div>
            <div className="absolute h-[14.77px] left-[594.58px] top-1/2 translate-y-[-50%] w-[80.19px]" data-name="Item → Link">
              <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[13px] justify-center leading-[0] left-0 not-italic text-[13px] text-black top-[6.5px] tracking-[1.662px] translate-y-[-50%] uppercase w-[80.39px]">
                <p className="leading-[14.77px]">Shopping</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="absolute h-[150.08px] left-0 overflow-clip right-[318.92px] top-0" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-white inset-0" />
        <div className="absolute inset-0 overflow-hidden">
          <ImageWithFallback alt="Fitness lifestyle" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(6)} />
        </div>
      </div>
    </div>
  );
}

function Link7() {
  return (
    <div className="absolute h-[77.22px] left-[16px] right-[-5px] top-[14.77px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[61.81px] justify-center leading-[22.4px] left-0 text-[16px] text-black top-[37.91px] tracking-[-0.229px] translate-y-[-50%] w-[194.44px]">
        <p className="mb-0">豪華ゲストも来��した、</p>
        <p className="mb-0">「FEEL HOUSE」オープニ</p>
        <p>ングパーティーの動画を✔️</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute h-[118.98px] left-[150.07px] right-[102.93px] top-0" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[14.77px] justify-center leading-[0] left-[16px] text-[12px] text-black top-[7.39px] tracking-[1.662px] translate-y-[-50%] uppercase w-[88.62px]">
        <p className="leading-[14.77px]">Promotion</p>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-[16px] text-[11px] text-black top-[112.99px] tracking-[1.8px] translate-y-[-50%] uppercase w-[17.04px]">
        <p className="leading-[12px]">By</p>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-[35.85px] text-[11px] text-black top-[112.99px] tracking-[1.8px] translate-y-[-50%] uppercase w-[42.22px]">
        <p className="leading-[12px]">UGG®</p>
      </div>
      <Link7 />
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute h-[150.08px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <Container12 />
      <Container13 />
    </div>
  );
}

function HtmlBody() {
  return (
    <div className="absolute h-[150.08px] left-0 right-[0.34px] top-0" data-name="Html → Body">
      <Container14 />
    </div>
  );
}

function IframeAdvertisement() {
  return (
    <div className="absolute h-[150px] left-[calc(50%+501.33px)] overflow-clip top-[16px] translate-x-[-50%] w-[469.34px]" data-name="Iframe - Advertisement">
      <HtmlBody />
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute h-[182px] left-[40px] right-[40px] top-[58px]" data-name="Container">
      <Button5 />
      <div className="absolute h-[159.11px] left-[565.33px] right-[565.34px] top-[16px]" data-name="Button">
        <div className="absolute h-[135.11px] left-0 right-[334.22px] top-0" data-name="Container" />
        <div className="absolute left-0 overflow-clip top-0 w-[135.11px] h-[135.11px]" data-name="Container">
          <div className="absolute aspect-[135.11/135.11] left-0 right-0 top-0" data-name="Picture → ロンドンのストリ��トを席巻中。この���、“シガレットジーンズ”をモダンに着こなす5つのヒント">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <ImageWithFallback alt="Woman exercise" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(7)} />
            </div>
          </div>
        </div>
        <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] leading-[16px] left-[151.11px] not-italic text-[11.4px] text-black top-[16px] tracking-[1.8px] uppercase max-w-[398px]">
          <p>{`Trend&Story`}</p>
        </div>
        <Link6 />
        <Container11 />
      </div>
      <IframeAdvertisement />
    </div>
  );
}

function Background() {
  return <TrendingSection />;
}

function Border2({ title }: { title: string }) {
  const categorySlug = title.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="relative h-[60px]" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid left-[64px] right-[64px] max-md:left-[20px] max-md:right-[20px] inset-y-0 pointer-events-none" style={{ height: '30px' }} />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-[64px] max-md:left-[20px] not-italic text-[21px] text-black top-[15px] tracking-[2.1px] translate-y-[-50%] uppercase w-[200px] max-md:text-[18px] max-md:tracking-[1.8px]">
        <p className="leading-[24px]">{title}</p>
      </div>
      <div 
        className="absolute right-[64px] max-md:right-[20px] top-[15px] translate-y-[-50%] cursor-pointer group"
        data-name={`Item → Link → ${categorySlug}`}
      >
        <div className="flex items-center gap-2">
          <div className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[14px] tracking-[2px] uppercase text-black group-hover:opacity-70 transition-opacity">
            MORE
          </div>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform">
            <path d="M7.5 5L12.5 10L7.5 15" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// 4カラム用の正方形カードコンポーネント
function SquareCard({ index, category }: { index: number; category: string }) {
  return (
    <div className="relative group cursor-pointer" data-name="Button">
      <div className="aspect-square w-full overflow-hidden">
        <ImageWithFallback 
          alt={`${category} sport`} 
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
            <p className="leading-[16.36px] tracking-[0.05em]">By VOGUE TEAM</p>
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

// 4カラムレイアウトのコンテナ
function Container4Column({ categories }: { categories: Array<{ index: number; category: string }> }) {
  return (
    <div className="relative mt-[20px]" data-name="Container">
      {/* デスクトップ用グリッド */}
      <div className="grid grid-cols-4 gap-[32px] mx-[64px] max-md:hidden">
        {categories.map((item, i) => (
          <SquareCard key={i} index={item.index} category={item.category} />
        ))}
      </div>
      {/* モバイル用横スクロール */}
      <div className="hidden max-md:block overflow-x-auto">
        <div className="flex gap-[16px] pb-4 pl-[20px]">
          {categories.map((item, i) => (
            <div key={i} className="flex-shrink-0 w-[calc(100vw-80px)]">
              <SquareCard index={item.index} category={item.category} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Picture1() {
  return (
    <div className="absolute aspect-[704/1056] left-0 right-0 top-0" data-name="Picture → アクネ ストゥディオズのロゴマフラーが“冬の主役”に。定番アイテムが注目を集め続ける理由">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(8)} />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="Container">
      <Picture1 />
      <div className="absolute bg-gradient-to-t from-[#000000] inset-0 to-65% to-[rgba(0,0,0,0)]" data-name="Gradient" />
    </div>
  );
}

function Heading() {
  return (
    <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[44.8px] left-[48px] right-[48px] text-[32px] text-white top-[32px] tracking-[0.8px]" data-name="Heading 2">
      <p className="leading-[44.8px]">ヨガ＆ピラティスで理想のライフスタイルを手に入れる</p>
    </div>
  );
}

function HeadingOld() {
  return (
    <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[44.8px] left-[48px] right-[48px] text-[32px] text-white top-[32px] tracking-[0.8px]" data-name="Heading 2">
      <p className="leading-[44.8px]">PLACEHOLDER</p>
      <div className="absolute flex flex-col h-[46px] justify-center left-[5.55px] top-[66.8px] translate-y-[-50%] w-[522.844px]">
        <p className="leading-[44.8px]">ラーが“冬の主役”に。定番アイテム</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[73.27px] top-[111.59px] translate-y-[-50%] w-[360.121px]">
        <p className="leading-[44.8px]">が注目���集め続ける理由</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute h-[16.36px] left-[48px] right-[48px] top-[182.39px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-white top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase overflow-hidden text-ellipsis">
        <p className="leading-[16.36px]">
          By SANA TAJIKA<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>REONA KONDO
        </p>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.9)] h-[268.75px] left-0 right-0 to-[rgba(0,0,0,0.55)] top-[100px]" data-name="Background">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[48px] not-italic text-[#f8f8f8] text-[11.8px] top-[8px] tracking-[1.8px] translate-y-[-50%] uppercase overflow-hidden text-ellipsis">
        <p className="leading-[16px] whitespace-nowrap">{`YOGA & PILATES / WELLNESS`}</p>
      </div>
      <Heading />
      <Container17 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-[48px] text-[12px] text-white top-[221.75px] tracking-[-0.1px] translate-y-[-50%]">
        <p className="leading-[14px]">2025年11月11日</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute h-[368.75px] left-0 right-0 top-[681.25px]" data-name="Container">
      <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.55)] h-[100px] left-0 right-0 to-[rgba(0,0,0,0)] top-0" data-name="Gradient" />
      <Background1 />
    </div>
  );
}

function Container19() {
  return (
    <div className="h-[1050px] pointer-events-auto sticky top-0" data-name="Container">
      <Container16 />
      <Container18 />
    </div>
  );
}

// Container19の大きい記事をButton形式に変換（スマホのグリッド用）
function ButtonMain() {
  return (
    <div className="relative group cursor-pointer max-md:col-span-2" data-name="Button">
      <div className="relative aspect-[704/1056] overflow-hidden max-md:aspect-[2/1.2]">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(8)} />
        <div className="absolute bg-gradient-to-t from-[#000000] inset-0 to-65% to-[rgba(0,0,0,0)]" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 max-md:p-6">
          <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] not-italic text-[#f8f8f8] text-[11.8px] tracking-[1.8px] uppercase mb-6 max-md:mb-3">
            <p className="leading-[16px]">{`YOGA & PILATES / WELLNESS`}</p>
          </div>
          <div className="font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[44.8px] text-[32px] text-white tracking-[0.8px] mb-4 max-md:text-[24px] max-md:leading-[32px]">
            <p className="leading-[44.8px] max-md:leading-[32px]">ヨガ＆ピラティスで理想のライフスタイルを手に入れる</p>
          </div>
          <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] not-italic text-[12px] text-white tracking-[1.964px] uppercase mb-2">
            <p className="leading-[16.36px]">
              By SANA TAJIKA<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>REONA KONDO
            </p>
          </div>
          <div className="flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] text-[12px] text-white tracking-[-0.1px]">
            <p className="leading-[14px]">2025年11月11日</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pictureeel() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0 max-md:relative" data-name="Picture → 今冬に投資するなら、ザ・ロウの大人顔ローファー「EEL」が正解 ──2025-26年秋冬スタイルを格上げする靴バッグ＆小物">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman training" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(9)} />
      </div>
    </div>
  );
}

function Link8() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[16px] max-md:leading-[20px] max-md:w-full max-md:max-w-full">
        <p className="mb-0">朝のヨガルーティン── 1��を元気にスタートさせる10分間のフロー</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By MAYUMI NUMAO</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute h-[540.36px] left-0 right-[384px] top-0 max-md:relative max-md:h-auto max-md:right-0 group cursor-pointer" data-name="Button">
      <Pictureeel />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link8 />
      <Container20 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月7日</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute h-[352px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Active woman" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(10)} />
      </div>
    </div>
  );
}

function Link9() {
  return (
    <div className="absolute h-[352px] left-0 right-0 top-0" data-name="Link">
      <Container21 />
    </div>
  );
}

function Link10() {
  return (
    <div className="absolute h-[42px] left-0 top-px w-[344.06px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[21px] tracking-[-0.225px] translate-y-[-50%] w-[344.26px]">
        <p className="mb-0">今だけ！リファの限定デザインのショッパ</p>
        <p>ーやギフトボックス</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[400px]" data-name="Container">
      <Link10 />
    </div>
  );
}

function Link11() {
  return (
    <div className="absolute h-[17px] left-0 top-[461px] w-[59.08px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[11px] tracking-[1.964px] translate-y-[-50%] uppercase w-[59.28px]">
        <p className="leading-[13.09px]">By REFA</p>
      </div>
    </div>
  );
}

function IframeAdvertisementHtmlBody() {
  return (
    <div className="absolute h-[479.09px] left-0 overflow-clip right-[384px] top-[556.36px]" data-name="Iframe - Advertisement → Html → Body">
      <Link9 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[382px] tracking-[1.8px] translate-y-[-50%] uppercase w-[89.86px]">
        <p className="leading-[16px]">Promotion</p>
      </div>
      <Container22 />
      <Link11 />
    </div>
  );
}

function Picture2() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0 max-md:relative" data-name="Picture → 【追悼】アントワープ・シックスのひとり、マリナ・イーの静かなる軌跡">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates reformer" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(18)} />
      </div>
    </div>
  );
}

function Link12() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px]">
        <p>ピラティスリフォーマーを使ったトレーニング── 効果的なエクササイズ法</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By Laird Borrelli-Persson</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute h-[540.36px] left-0 right-[384px] top-[1112.72px] max-md:relative max-md:h-auto max-md:right-0 group cursor-pointer" data-name="Button">
      <Picture2 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link12 />
      <Container23 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月14日</p>
      </div>
    </div>
  );
}

function Picture4() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0 max-md:relative" data-name="Picture → 次に迎えたい定番品、ヴァレンティノ ガラヴァーニの新作「パンテア」バッグ">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman workout" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(12)} />
      </div>
    </div>
  );
}

function Link13() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[16px] max-md:leading-[20px] max-md:w-full max-md:max-w-full">
        <p>呼吸法とマインドフルネス── ヨガで心を整える瞑想テクニック</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By Laura Tortora</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute h-[540.36px] left-[384px] right-0 top-0 max-md:relative max-md:h-auto max-md:left-0 group cursor-pointer" data-name="Button">
      <Picture4 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link13 />
      <Container24 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Component3() {
  return (
    <div className="absolute h-[600px] left-0 top-[-586px] w-[300px]" data-name="7922358656877247436">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(13)} />
      </div>
    </div>
  );
}

function Link14() {
  return (
    <div className="absolute h-[17px] left-0 top-[586px] w-[300px]" data-name="Link">
      <Component3 />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute h-[600px] left-0 overflow-clip top-0 w-[300px]" data-name="Container">
      <Link14 />
    </div>
  );
}

function HtmlBody1() {
  return (
    <div className="absolute h-[0.01px] left-0 right-0 top-0" data-name="Html → Body">
      <Container25 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[-599.99px] h-[600px] right-0 w-[300px]" data-name="Image" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1762384382290-e328f064fa57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdlbGxuZXNzJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2MzM3OTIyMXww&ixlib=rb-4.1.0&q=80&w=1080')` }} />
    </div>
  );
}

function IframeAdvertisement1() {
  return (
    <div className="absolute h-[600px] left-[calc(50%+192px)] overflow-clip top-[710.36px] translate-x-[-50%] w-[300px]" data-name="Iframe - Advertisement">
      <HtmlBody1 />
    </div>
  );
}

function Picture9() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → ロンドンのストリートを席巻中。この秋、“シガレットジーンズ”をモダンに着�����す5つのヒント">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman running" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(14)} />
      </div>
    </div>
  );
}

function Link15() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[382.676px]">
        <p className="mb-0">ロンドンのストリートを席巻中。この秋、“シガ</p>
        <p className="mb-0">レットジーンズ”をモダンに着こなす5つのヒン</p>
        <p>ト</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By Daisy Jones</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute h-[540.36px] left-[384px] right-0 top-[1112.72px] max-md:relative max-md:h-auto max-md:left-0 group cursor-pointer" data-name="Button">
      <Picture9 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link15 />
      <Container26 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月16日</p>
      </div>
    </div>
  );
}

function Picture11A() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0 max-md:relative" data-name="Picture → Yoga Article 11">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman doing yoga" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(15)} />
      </div>
    </div>
  );
}

function Link16A() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[16px] max-md:leading-[20px] max-md:w-full max-md:max-w-full">
        <p>アシュタンガヨガの基礎── 初心者のための太陽礼拝とポーズ解説</p>
      </div>
    </div>
  );
}

function Container30A() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By Sarah Williams</p>
      </div>
    </div>
  );
}

function Button11A() {
  return (
    <div className="absolute h-[540.36px] left-0 right-[384px] top-[556.36px] max-md:relative max-md:h-auto max-md:right-0 group cursor-pointer" data-name="Button">
      <Picture11A />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link16A />
      <Container30A />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月15日</p>
      </div>
    </div>
  );
}

function Picture12A() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0 max-md:relative" data-name="Picture → Yoga Article 12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman in pilates" className="absolute left-0 max-w-none size-full top-0 object-cover group-hover:scale-105 transition-transform duration-300" src={getImage(16)} />
      </div>
    </div>
  );
}

function Link17A() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Link">
      <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[16px] max-md:leading-[20px] max-md:w-full max-md:max-w-full">
        <p>体幹を鍛える── ピラティスで美しい姿勢と強い体を手に入れる</p>
      </div>
    </div>
  );
}

function Container31A() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px] max-md:relative max-md:h-auto max-md:top-0 max-md:mt-2" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:text-[10px] max-md:w-full max-md:max-w-full">
        <p className="leading-[16.36px] tracking-[0.05em] max-md:leading-[14px]">By Emma Thompson</p>
      </div>
    </div>
  );
}

function Button12A() {
  return (
    <div className="absolute h-[540.36px] left-[384px] right-0 top-[556.36px] max-md:relative max-md:h-auto max-md:left-0 group cursor-pointer" data-name="Button">
      <Picture12A />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-4">
        <p className="leading-[16px]">{`YOGA & PILATES / TREND & STORY`}</p>
      </div>
      <Link17A />
      <Container31A />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[352px] max-w-[352px] max-md:relative max-md:top-0 max-md:translate-y-0 max-md:mt-1 max-md:text-[11px] max-md:w-full max-md:max-w-full">
        <p className="leading-[14px] max-md:leading-[12px]">2025年11月14日</p>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute h-[1906.72px] left-[800px] right-[64px] top-0 max-md:!relative max-md:!h-auto max-md:!left-0 max-md:!right-0 max-md:grid max-md:grid-cols-2 max-md:gap-[16px]" data-name="Container" data-scroll-section="0">
      <div className="hidden max-md:block max-md:col-span-2">
        <ButtonMain />
      </div>
      <Button7 />
      <Button9 />
      <Button11A />
      <Button8 />
      <Button10 />
      <Button12A />
    </div>
  );
}

function Container28({ layout = "default" }: { layout?: "default" | "grid" }) {
  if (layout === "grid") {
    return (
      <div className="relative h-[1906.72px] overflow-hidden max-md:h-auto" data-name="Container" data-scroll-parent="yoga-section">
        <div className="absolute inset-0 mx-[64px] max-md:mx-[20px] max-md:!relative grid grid-cols-4 gap-[32px] max-md:grid-cols-2">
          <Button7 />
          <Button9 />
          <Button11A />
          <Button8 />
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative h-[1906.72px] overflow-hidden max-md:h-auto max-md:overflow-visible" data-name="Container" data-scroll-parent="yoga-section">
      <div className="absolute bottom-0 left-[64px] pointer-events-none right-[832px] top-0 max-md:hidden">
        <Container19 />
      </div>
      <Container27 />
    </div>
  );
}

function Container29() {
  return (
    <div className="absolute h-[2000.41px] left-[40px] right-[40px] top-[1814.03px] max-md:!relative max-md:!h-auto max-md:!left-0 max-md:!right-0 max-md:px-[20px] max-md:!top-0 max-md:mb-20" data-name="Container">
      <Border2 title="YOGA & PILATES" />
      <Container28 />
    </div>
  );
}

function Border3() {
  return (
    <div className="absolute h-[50px] left-[64px] right-[64px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-0 not-italic text-[21px] text-black top-[25px] tracking-[2.1px] translate-y-[-50%] uppercase w-[130px]">
        <p className="leading-[24px]">CELEBRITY</p>
      </div>
    </div>
  );
}

function PictureBlackpinkdeadline() {
  return (
    <div className="absolute aspect-[704/1056] left-0 right-0 top-0" data-name="Picture → BLACKPINKリサのスタイリストに独占インタビュー。「DEADLINE」ワールドツアールックのインスピレーションとは">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga pose" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(0)} />
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="Container">
      <PictureBlackpinkdeadline />
      <div className="absolute bg-gradient-to-t from-[#000000] inset-0 to-65% to-[rgba(0,0,0,0)]" data-name="Gradient" />
    </div>
  );
}

function Heading1() {
  return (
    <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[179.19px] leading-[0] left-[102px] right-[102px] text-[32px] text-white top-[32px] tracking-[0.8px]" data-name="Heading 2">
      <div className="absolute flex flex-col h-[46px] justify-center left-[13.22px] top-[22px] translate-y-[-50%] w-[510.31px]">
        <p className="leading-[44.8px]">BLACKPINKリサのスタイリストに</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[23.17px] top-[66.8px] translate-y-[-50%] w-[520.498px]">
        <p className="leading-[44.8px]">独占インタビュー。「DEADLINE」</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[27.31px] top-[111.59px] translate-y-[-50%] w-[488.781px]">
        <p className="leading-[44.8px]">ワールドツアールックのインスピ</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[146.66px] top-[156.39px] translate-y-[-50%] w-[228.24px]">
        <p className="leading-[44.8px]">レーションとは</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute h-[16.36px] left-[48px] right-[48px] top-[227.19px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[calc(50%+0.1px)] not-italic text-[11.8px] text-center text-white top-[8px] tracking-[1.964px] translate-x-[-50%] translate-y-[-50%] uppercase w-[99.03px]">
        <p className="leading-[16.36px]">By Irene Kim</p>
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.9)] h-[313.55px] left-0 right-0 to-[rgba(0,0,0,0.55)] top-[100px]" data-name="Background">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[285.02px] not-italic text-[#f8f8f8] text-[11.4px] top-[8px] tracking-[1.8px] translate-y-[-50%] uppercase w-[134.15px]">
        <p className="leading-[16px] whitespace-nowrap">CELEBRITY / STYLE</p>
      </div>
      <Heading1 />
      <Container31 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-[310.55px] text-[12px] text-white top-[266.55px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月7日</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute h-[413.55px] left-0 right-0 top-[636.45px]" data-name="Container">
      <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.55)] h-[100px] left-0 right-0 to-[rgba(0,0,0,0)] top-0" data-name="Gradient" />
      <Background2 />
    </div>
  );
}

function Container33() {
  return (
    <div className="h-[1050px] pointer-events-auto sticky top-0" data-name="Container">
      <Container30 />
      <Container32 />
    </div>
  );
}

function Pictureshogun1() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → 『SHOGUN 将軍』シ���ズン2の新キャストが発表! 水川あさみと窪田正孝が夫婦共演">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates exercise" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(1)} />
      </div>
    </div>
  );
}

function Link16() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[373.263px]">
        <p className="mb-0">『SHOGUN 将軍』シーズン2の新キャストが発</p>
        <p>表! 水川あさみと窪田正孝が夫婦共演</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[452px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[183.47px]">
        <p className="leading-[16.36px]">By SAORI NAKADOZONO</p>
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="absolute h-[518.36px] left-0 right-[384px] top-0" data-name="Button">
      <Pictureshogun1 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[134.33px]">
        <p className="leading-[16px] whitespace-nowrap">CELEBRITY / NEWS</p>
      </div>
      <Link16 />
      <Container34 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[479.35px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="absolute h-[352px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Fitness woman" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(2)} />
      </div>
    </div>
  );
}

function Link17() {
  return (
    <div className="absolute h-[352px] left-0 right-0 top-0" data-name="Link">
      <Container35 />
    </div>
  );
}

function Link18() {
  return (
    <div className="absolute h-[42px] left-0 top-px w-[341.95px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[21px] tracking-[-0.225px] translate-y-[-50%] w-[342.15px]">
        <p className="mb-0">おうち時間��質を高める。高機能ルームウ</p>
        <p>ェア</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[400px]" data-name="Container">
      <Link18 />
    </div>
  );
}

function Link19() {
  return (
    <div className="absolute h-[17px] left-0 top-[461px] w-[59.08px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[11px] tracking-[1.964px] translate-y-[-50%] uppercase w-[59.28px]">
        <p className="leading-[13.09px]">By REFA</p>
      </div>
    </div>
  );
}

function IframeAdvertisementHtmlBody1() {
  return (
    <div className="absolute h-[479.09px] left-0 overflow-clip right-[384px] top-[534.35px]" data-name="Iframe - Advertisement → Html → Body">
      <Link17 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[382px] tracking-[1.8px] translate-y-[-50%] uppercase w-[89.86px]">
        <p className="leading-[16px]">Promotion</p>
      </div>
      <Container36 />
      <Link19 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[0.09px] right-0 size-[100px]" data-name="Image" style={{ backgroundImage: `url('${getImage(6)}')` }} />
    </div>
  );
}

function Picture10() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → トム・フェルトン、父となったドラコ・マルフォイとしてブロードウェイ舞台『ハリー・ポッターと呪いの子』に立つ">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(7)} />
      </div>
    </div>
  );
}

function Link20() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[421.104px]">
        <p className="mb-0">トム・フェルトン、父となったドラコ・マルフォイと</p>
        <p className="mb-0">してブロードウェイ舞台『ハリー・ポッターと呪</p>
        <p>いの子』に立つ</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[650px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[95.42px]">
        <p className="leading-[16.36px]">By TAE TERAI</p>
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="absolute h-[716.36px] left-0 right-[384px] top-[1053.35px]" data-name="Button">
      <Picture10 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[134.33px]">
        <p className="leading-[16px] whitespace-nowrap">CELEBRITY / NEWS</p>
      </div>
      <Link20 />
      <Container37 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[677.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Picture29() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → 『プラダを着た悪魔２���の予告編が解禁！ 2026年5月1日に日米同時公開へ">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman active" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(8)} />
      </div>
    </div>
  );
}

function Link21() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[381.981px]">
        <p className="mb-0">『プラダを着た悪魔２』の予告編が解禁！ 2026</p>
        <p>年5月1日に日米同時公開へ</p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[628px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[183.47px]">
        <p className="leading-[16.36px]">By SAORI NAKADOZONO</p>
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute h-[694.36px] left-[384px] right-0 top-0" data-name="Button">
      <Picture29 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[134.33px]">
        <p className="leading-[16px] whitespace-nowrap">CELEBRITY / NEWS</p>
      </div>
      <Link21 />
      <Container38 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[655.35px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Component1() {
  return (
    <div className="absolute h-[600px] left-0 top-[-586px] w-[300px]" data-name="4143341139348352501">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(15)} />
      </div>
    </div>
  );
}

function Link22() {
  return (
    <div className="absolute h-[17px] left-0 top-[586px] w-[300px]" data-name="Link">
      <Component1 />
    </div>
  );
}

function Container39() {
  return (
    <div className="absolute h-[600px] left-0 overflow-clip top-0 w-[300px]" data-name="Container">
      <Link22 />
    </div>
  );
}

function HtmlBody2() {
  return (
    <div className="absolute h-[0.01px] left-0 right-0 top-0" data-name="Html → Body">
      <Container39 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[-599.99px] h-[600px] right-0 w-[300px]" data-name="Image" style={{ backgroundImage: `url('${getImage(9)}')` }} />
    </div>
  );
}

function IframeAdvertisement2() {
  return (
    <div className="absolute h-[600px] left-[calc(50%+192px)] overflow-clip top-[710.35px] translate-x-[-50%] w-[300px]" data-name="Iframe - Advertisement">
      <HtmlBody2 />
    </div>
  );
}

function Picture11() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → キャサリン妃、未来の王妃として新たな役割を果たす">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(10)} />
      </div>
    </div>
  );
}

function Link23() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[373.079px]">
        <p className="mb-0">キャサリン妃、未来の王妃として新たな役割を</p>
        <p>果たす</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[452px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[95.42px]">
        <p className="leading-[16.36px]">By TAE TERAI</p>
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute h-[518.36px] left-[384px] right-0 top-[1350.35px]" data-name="Button">
      <Picture11 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[134.33px]">
        <p className="leading-[16px] whitespace-nowrap">CELEBRITY / NEWS</p>
      </div>
      <Link23 />
      <Container40 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[479.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="absolute h-[1884.72px] left-[736px] right-0 top-0" data-name="Container" data-scroll-section="1">
      <Button11 />
      <IframeAdvertisementHtmlBody1 />
      <Button12 />
      <Button13 />
      <IframeAdvertisement2 />
      <Button14 />
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute h-[1884.72px] left-[64px] right-[64px] top-[93.69px]" data-name="Container">
      <div className="absolute bottom-0 left-0 pointer-events-none right-[768px] top-0">
        <Container33 />
      </div>
      <Container41 />
    </div>
  );
}

function Container43() {
  return (
    <div className="absolute h-[1978.41px] left-[40px] right-[40px] top-[3844.44px]" data-name="Container">
      <Border3 />
      <Container42 />
    </div>
  );
}

function Border4() {
  return (
    <div className="absolute h-[50px] left-[64px] right-[64px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-0 not-italic text-[21px] text-black top-[25px] tracking-[2.1px] translate-y-[-50%] uppercase w-[95px]">
        <p className="leading-[24px]">BEAUTY</p>
      </div>
    </div>
  );
}

function Picture12() {
  return (
    <div className="absolute aspect-[704/1056] left-0 right-0 top-0" data-name="Picture → 髪のパサつき＆頭皮の乾燥対策に導入したい保湿“シャントリ”5選">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman stretching" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(11)} />
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="Container">
      <Picture12 />
      <div className="absolute bg-gradient-to-t from-[#000000] inset-0 to-65% to-[rgba(0,0,0,0)]" data-name="Gradient" />
    </div>
  );
}

function Heading2() {
  return (
    <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[89.59px] leading-[0] left-[102px] right-[102px] text-[32px] text-white top-[32px] tracking-[0.8px]" data-name="Heading 2">
      <div className="absolute flex flex-col h-[46px] justify-center left-[13.45px] top-[22px] translate-y-[-50%] w-[491.362px]">
        <p className="leading-[44.8px]">髪のパサつき＆頭���の乾燥対策に</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[26.42px] top-[66.8px] translate-y-[-50%] w-[479.406px]">
        <p className="leading-[44.8px]">導入したい保湿“シャントリ”5選</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute h-[16.36px] left-[48px] right-[48px] top-[137.59px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[calc(50%+0.1px)] not-italic text-[12px] text-center text-white top-[8px] tracking-[1.964px] translate-x-[-50%] translate-y-[-50%] uppercase w-[264.8px]">
        <p className="leading-[16.36px]">
          By MANAMI REN<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>MAKIKO YOSHIDA
        </p>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.9)] h-[223.95px] left-0 right-0 to-[rgba(0,0,0,0.55)] top-[100px]" data-name="Background">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[288.95px] not-italic text-[#f8f8f8] text-[11.6px] top-[8px] tracking-[1.8px] translate-y-[-50%] uppercase w-[126.28px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / TRENDS</p>
      </div>
      <Heading2 />
      <Container45 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-[307.19px] text-[12px] text-white top-[176.95px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="absolute h-[323.95px] left-0 right-0 top-[726.05px]" data-name="Container">
      <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.55)] h-[100px] left-0 right-0 to-[rgba(0,0,0,0)] top-0" data-name="Gradient" />
      <Background3 />
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[1050px] pointer-events-auto sticky top-0" data-name="Container">
      <Container44 />
      <Container46 />
    </div>
  );
}

function Picture13() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → シワやクマがあってもゴージャス。ヴィクシーモデルのすっぴん画像を見て私が思ったこと【セレブ美容探偵】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(12)} />
      </div>
    </div>
  );
}

function Link24() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[388.333px]">
        <p className="mb-0">シワやクマがあってもゴージャス。ヴィクシーモ</p>
        <p className="mb-0">デルのすっぴん画像を見て私が思ったこと【セ</p>
        <p>レブ美容探偵】</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[246.4px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By MOYURU SAKAI<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>TORU MITANI
        </p>
      </div>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute h-[540.36px] left-0 right-[384px] top-0" data-name="Button">
      <Picture13 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.6px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[123.98px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / EXPERT</p>
      </div>
      <Link24 />
      <Container48 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月10日</p>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute h-[352px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(31)} />
      </div>
    </div>
  );
}

function Link25() {
  return (
    <div className="absolute h-[352px] left-0 right-0 top-0" data-name="Link">
      <Container49 />
    </div>
  );
}

function Link26() {
  return (
    <div className="absolute h-[42px] left-0 top-px w-[347.58px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[21px] tracking-[-0.225px] translate-y-[-50%] w-[347.78px]">
        <p className="mb-0">ペリエ ジュエと名店の美食が織り��す特別</p>
        <p>なひととき</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[400px]" data-name="Container">
      <Link26 />
    </div>
  );
}

function Link27() {
  return (
    <div className="absolute h-[17px] left-0 top-[461px] w-[134.66px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[11.3px] text-black top-[11px] tracking-[1.964px] translate-y-[-50%] uppercase w-[134.86px]">
        <p className="leading-[13.09px]">By PERRIER JOUET</p>
      </div>
    </div>
  );
}

function IframeAdvertisementHtmlBody2() {
  return (
    <div className="absolute h-[479.09px] left-0 overflow-clip right-[384px] top-[556.36px]" data-name="Iframe - Advertisement → Html → Body">
      <Link25 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[382px] tracking-[1.8px] translate-y-[-50%] uppercase w-[89.86px]">
        <p className="leading-[16px]">Promotion</p>
      </div>
      <Container50 />
      <Link27 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[0.09px] right-0 size-[100px]" data-name="Image" style={{ backgroundImage: `url('${getImage(0)}')` }} />
    </div>
  );
}

function Picture25() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → テ���ラー���スウィフト、“フィッシュテール三つ編み”で2000年代ヘアを再燃">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman active" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(1)} />
      </div>
    </div>
  );
}

function Link28() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[399.677px]">
        <p className="mb-0">テイラー・スウィフト、“フィッシュテール三つ編</p>
        <p>み”で2000年代ヘアを再燃</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[628px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[140.56px]">
        <p className="leading-[16.36px]">By Anna Cafolla</p>
      </div>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute h-[694.36px] left-0 right-[384px] top-[1075.36px]" data-name="Button">
      <Picture25 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.6px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[126.28px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / TRENDS</p>
      </div>
      <Link28 />
      <Container51 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[655.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月10日</p>
      </div>
    </div>
  );
}

function Picture8() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → 風邪・インフルエ��ザに負けない体づくりを。栄養士が勧める、“亜鉛”が豊富な食品8選">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga pose" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(2)} />
      </div>
    </div>
  );
}

function Link29() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[390.786px]">
        <p className="mb-0">風邪・インフルエンザに負けない体づくりを。栄</p>
        <p>養士が勧める、“亜鉛”が豊富な食品8選</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[628px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[149.26px]">
        <p className="leading-[16.36px]">By Morgan Fargo</p>
      </div>
    </div>
  );
}

function Button17() {
  return (
    <div className="absolute h-[694.36px] left-0 right-[384px] top-[1785.72px]" data-name="Button">
      <Picture8 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[143.61px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / WELLNESS</p>
      </div>
      <Link29 />
      <Container52 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[655.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月4日</p>
      </div>
    </div>
  );
}

function Picture14() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → 不自然なヒアル顔を避けて、横顔美を整える。美��医療の最前線を医師に取材">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness training" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(3)} />
      </div>
    </div>
  );
}

function Link30() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[371.914px]">
        <p className="mb-0">不自然なヒアル顔を避けて、横顔美を整える。</p>
        <p>美容医療の最前線を医師に取材</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[628px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[267.54px]">
        <p className="leading-[16.36px] text-[11.4px]">
          By TERUNO TAIRA<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>MISAKI KAWATSU
        </p>
      </div>
    </div>
  );
}

function Button18() {
  return (
    <div className="absolute h-[694.36px] left-[384px] right-0 top-0" data-name="Button">
      <Picture14 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[143.61px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / WELLNESS</p>
      </div>
      <Link30 />
      <Container53 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[655.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月11日</p>
      </div>
    </div>
  );
}

function Component2() {
  return (
    <div className="absolute h-[600px] left-0 top-[-586px] w-[300px]" data-name="7922358656877247436">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(14)} />
      </div>
    </div>
  );
}

function Link31() {
  return (
    <div className="absolute h-[17px] left-0 top-[586px] w-[300px]" data-name="Link">
      <Component2 />
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute h-[600px] left-0 overflow-clip top-0 w-[300px]" data-name="Container">
      <Link31 />
    </div>
  );
}

function HtmlBody3() {
  return (
    <div className="absolute h-[0.01px] left-0 right-0 top-0" data-name="Html → Body">
      <Container54 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[-599.99px] h-[600px] right-0 w-[300px]" data-name="Image" style={{ backgroundImage: `url('${getImage(4)}')` }} />
    </div>
  );
}

function IframeAdvertisement3() {
  return (
    <div className="absolute h-[600px] left-[calc(50%+192px)] overflow-clip top-[710.36px] translate-x-[-50%] w-[300px]" data-name="Iframe - Advertisement">
      <HtmlBody3 />
    </div>
  );
}

function Picture15() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → なぜ私は“食”を変えたのか──ヴェルヌ華子が語る、心と体���整えるプラントベースライ���">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman sport" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(5)} />
      </div>
    </div>
  );
}

function Link32() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[372.187px]">
        <p className="mb-0">なぜ私は“食”を変えたのか──ヴェルヌ華子</p>
        <p>が語る、心と体を整えるプラントベースライフ</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[452px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[258.73px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By CHIHO EJIRI<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>MAKIKO YOSHIDA
        </p>
      </div>
    </div>
  );
}

function Button19() {
  return (
    <div className="absolute h-[518.36px] left-[384px] right-0 top-[1350.36px]" data-name="Button">
      <Picture15 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.4px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[143.61px]">
        <p className="leading-[16px] whitespace-nowrap">BEAUTY / WELLNESS</p>
      </div>
      <Link32 />
      <Container55 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[479.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月5日</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute h-[2496.08px] left-[736px] right-0 top-0" data-name="Container" data-scroll-section="2">
      <Button15 />
      <IframeAdvertisementHtmlBody2 />
      <Button16 />
      <Button17 />
      <Button18 />
      <IframeAdvertisement3 />
      <Button19 />
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute h-[2496.08px] left-[64px] right-[64px] top-[93.69px]" data-name="Container">
      <div className="absolute bottom-0 left-0 pointer-events-none right-[768px] top-0">
        <Container47 />
      </div>
      <Container56 />
    </div>
  );
}

function Container58() {
  return (
    <div className="absolute h-[2589.77px] left-[40px] right-[40px] top-[5918.84px]" data-name="Container">
      <Border4 />
      <Container57 />
    </div>
  );
}

function Border5() {
  return (
    <div className="absolute h-[50px] left-[64px] right-[64px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-0 not-italic text-[21px] text-black top-[25px] tracking-[2.1px] translate-y-[-50%] uppercase w-[120px]">
        <p className="leading-[24px]">LIFESTYLE</p>
      </div>
    </div>
  );
}

function Picture16() {
  return (
    <div className="absolute aspect-[704/1056] left-0 right-0 top-0" data-name="Picture → 「削ぎ落とした自分で、旅をしながら撮っていた」──河合優実が映画『旅と日々』で見た景色">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman exercise" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(6)} />
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute inset-0 overflow-clip" data-name="Container">
      <Picture16 />
      <div className="absolute bg-gradient-to-t from-[#000000] inset-0 to-65% to-[rgba(0,0,0,0)]" data-name="Gradient" />
    </div>
  );
}

function Heading3() {
  return (
    <div className="absolute font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[134.39px] leading-[0] left-[102px] right-[102px] text-[32px] text-white top-[32px] tracking-[0.8px]" data-name="Heading 2">
      <div className="absolute flex flex-col h-[46px] justify-center left-[2.27px] top-[22px] translate-y-[-50%] w-[555.547px]">
        <p className="leading-[44.8px]">「削ぎ落とした自分で、旅をしながら</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[19.28px] top-[66.79px] translate-y-[-50%] w-[489.677px]">
        <p className="leading-[44.8px]">撮っていた」──河合優実が映画</p>
      </div>
      <div className="absolute flex flex-col h-[46px] justify-center left-[90.36px] top-[111.59px] translate-y-[-50%] w-[360.124px]">
        <p className="leading-[44.8px]">『旅と日々』で見た景色</p>
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="absolute h-[16.36px] left-[48px] right-[48px] top-[182.39px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[calc(50%+0.09px)] not-italic text-[12px] text-center text-white top-[8px] tracking-[1.964px] translate-x-[-50%] translate-y-[-50%] uppercase w-[172.34px]">
        <p className="leading-[16.36px]">By NANAMI KOBAYASHI</p>
      </div>
    </div>
  );
}

function Background4() {
  return (
    <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.9)] h-[268.75px] left-0 right-0 to-[rgba(0,0,0,0.55)] top-[100px]" data-name="Background">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-[252.42px] not-italic text-[#f8f8f8] text-[11.1px] top-[8px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Heading3 />
      <Container60 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-[310.55px] text-[12px] text-white top-[221.75px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月6日</p>
      </div>
    </div>
  );
}

function Container61() {
  return (
    <div className="absolute h-[368.75px] left-0 right-0 top-[681.25px]" data-name="Container">
      <div className="absolute bg-gradient-to-t from-[rgba(0,0,0,0.55)] h-[100px] left-0 right-0 to-[rgba(0,0,0,0)] top-0" data-name="Gradient" />
      <Background4 />
    </div>
  );
}

function Container62() {
  return (
    <div className="h-[1050px] pointer-events-auto sticky top-0" data-name="Container">
      <Container59 />
      <Container61 />
    </div>
  );
}

function Picture17() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → フィラデルフィアに「カルダー・ガーデン」が誕生。構想からオープンまでの裏側に迫る">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(7)} />
      </div>
    </div>
  );
}

function Link33() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[390.682px]">
        <p className="mb-0">フィラデルフィアに「カルダー・ガーデン」が誕</p>
        <p>生。構想からオープンまでの裏側に迫る</p>
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[452px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[144.61px]">
        <p className="leading-[16.36px]">By Chloe Schama</p>
      </div>
    </div>
  );
}

function Button20() {
  return (
    <div className="absolute h-[518.36px] left-0 right-[384px] top-0" data-name="Button">
      <Picture17 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link33 />
      <Container63 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[479.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="absolute h-[352px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(32)} />
      </div>
    </div>
  );
}

function Link34() {
  return (
    <div className="absolute h-[352px] left-0 right-0 top-0" data-name="Link">
      <Container64 />
    </div>
  );
}

function Link35() {
  return (
    <div className="absolute h-[42px] left-0 top-px w-[342.38px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[21px] tracking-[-0.225px] translate-y-[-50%] w-[342.58px]">
        <p className="mb-0">小松菜奈、神秘に満ちたフェスティブメイ</p>
        <p>ク</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[400px]" data-name="Container">
      <Link35 />
    </div>
  );
}

function Link36() {
  return (
    <div className="absolute h-[17px] left-0 top-[461px] w-[83.58px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[11px] tracking-[1.964px] translate-y-[-50%] uppercase w-[83.78px]">
        <p className="leading-[13.09px]">By CHANEL</p>
      </div>
    </div>
  );
}

function IframeAdvertisementHtmlBody3() {
  return (
    <div className="absolute h-[479.09px] left-0 overflow-clip right-[384px] top-[534.36px]" data-name="Iframe - Advertisement → Html → Body">
      <Link34 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[12px] text-black top-[382px] tracking-[1.8px] translate-y-[-50%] uppercase w-[89.86px]">
        <p className="leading-[16px]">Promotion</p>
      </div>
      <Container65 />
      <Link36 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[0.09px] right-0 size-[100px]" data-name="Image" style={{ backgroundImage: `url('${getImage(8)}')` }} />
    </div>
  );
}

function Picture30() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → 木星逆行が起こる、2025年11月12日から2026年3月10日にすべきこと、避けるべきことは？">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(9)} />
      </div>
    </div>
  );
}

function Link37() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[370.975px]">
        <p className="mb-0 whitespace-nowrap">木星逆行が起こる、2025年11月12日から</p>
        <p className="mb-0 whitespace-nowrap">2026年3月10日にすべきこと、避けるべきこと</p>
        <p className="whitespace-nowrap">は？</p>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[650px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[335.86px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By GLORIOUS HOSHIKO<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>NANAMI KOBAYASHI
        </p>
      </div>
    </div>
  );
}

function Button21() {
  return (
    <div className="absolute h-[716.36px] left-0 right-[384px] top-[1053.36px]" data-name="Button">
      <Picture30 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link37 />
      <Container66 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[677.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月7���</p>
      </div>
    </div>
  );
}

function PicturesanaAvol() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → 人々が行き交う公園のような建築――妹島和世＋西沢立衛（SANAA）【世���に誇る日本の建築家たちvol.3】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman active lifestyle" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(10)} />
      </div>
    </div>
  );
}

function Link38() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[376.772px]">
        <p className="mb-0">人々が行き交う公園のような建築――妹島和</p>
        <p className="mb-0">世＋西沢立衛（SANAA）【世界に誇る日本の建</p>
        <p>築家たちvol.3】</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[650px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[294.26px]">
        <p className="leading-[16.36px]">
          By YUKA KUMANO<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>SAKURA KARUGANE
        </p>
      </div>
    </div>
  );
}

function Button22() {
  return (
    <div className="absolute h-[716.36px] left-0 right-[384px] top-[1785.72px]" data-name="Button">
      <PicturesanaAvol />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[138.51px]">
        <p className="leading-[16px]">LIFESTYLE / TRAVEL</p>
      </div>
      <Link38 />
      <Container67 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[677.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function PicturemyView() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → トランスジェンダー、当事者が演じる意義──映画���ブルーボーイ事件』が投げかける“問い”とは【MY VIEW｜飯塚花笑】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(11)} />
      </div>
    </div>
  );
}

function Link39() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[373.048px]">
        <p className="mb-0">トランスジェンダー、当事者が演じる意義──</p>
        <p className="mb-0">映画『ブルーボーイ事件』が投げかける“問</p>
        <p>い”とは【MY VIEW｜飯塚花笑】</p>
      </div>
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[650px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[328.47px]">
        <p className="leading-[16.36px] text-[11.6px]">
          By DAISUKE WATANUKI<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>NANAMI KOBAYASHI
        </p>
      </div>
    </div>
  );
}

function Button23() {
  return (
    <div className="absolute h-[716.36px] left-[384px] right-0 top-0" data-name="Button">
      <PicturemyView />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link39 />
      <Container68 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[677.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Component() {
  return (
    <div className="absolute h-[600px] left-0 top-[-586px] w-[300px]" data-name="4001938095621880204">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga sport" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(33)} />
      </div>
    </div>
  );
}

function Link40() {
  return (
    <div className="absolute h-[17px] left-0 top-[586px] w-[300px]" data-name="Link">
      <Component />
    </div>
  );
}

function Container69() {
  return (
    <div className="absolute h-[600px] left-0 overflow-clip top-0 w-[300px]" data-name="Container">
      <Link40 />
    </div>
  );
}

function HtmlBody4() {
  return (
    <div className="absolute h-[0.01px] left-0 right-0 top-0" data-name="Html → Body">
      <Container69 />
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[-599.99px] h-[600px] right-0 w-[300px]" data-name="Image" style={{ backgroundImage: `url('${getImage(12)}')` }} />
    </div>
  );
}

function IframeAdvertisement4() {
  return (
    <div className="absolute h-[600px] left-[calc(50%+192px)] overflow-clip top-[732.36px] translate-x-[-50%] w-[300px]" data-name="Iframe - Advertisement">
      <HtmlBody4 />
    </div>
  );
}

function PicturefabFive1() {
  return (
    <div className="absolute aspect-[352/352] left-0 right-0 top-0" data-name="Picture → 「ブルースのステージを再現するために“限界”に挑んだ」──ジェレミー・アレン・ホワイトの覚悟【FAB FIVE】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness lifestyle" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(3)} />
      </div>
    </div>
  );
}

function Link41() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[392px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[400.411px]">
        <p className="mb-0">「ブルースのステージを再現するために“限</p>
        <p className="mb-0">界”に挑んだ」──ジェレミー・アレン・ホワイ���</p>
        <p>の覚悟【FAB FIVE】</p>
      </div>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[474px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[285.65px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By HIROAKI SAITO<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>YAKA MATSUMOTO
        </p>
      </div>
    </div>
  );
}

function Button24() {
  return (
    <div className="absolute h-[540.36px] left-[384px] right-0 top-[1372.36px]" data-name="Button">
      <PicturefabFive1 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[376px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link41 />
      <Container70 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[501.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月13日</p>
      </div>
    </div>
  );
}

function Picture7() {
  return (
    <div className="absolute aspect-[352/528] left-0 right-0 top-0" data-name="Picture → ホリデーシーズン目前！ 華やかに聖夜を彩る、7大ラグジュアリーホテルの厳選クリスマスケーキ">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman sport fashion" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(13)} />
      </div>
    </div>
  );
}

function Link42() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[568px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[376.089px]">
        <p className="mb-0">ホリデーシーズン目前！ 華やかに聖夜を彩る、</p>
        <p className="mb-0">7大ラグジュアリーホテルの厳選クリスマス</p>
        <p>ケーキ</p>
      </div>
    </div>
  );
}

function Container71() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[650px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[294.26px]">
        <p className="leading-[16.36px]">
          By YUKA KUMANO<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>SAKURA KARUGANE
        </p>
      </div>
    </div>
  );
}

function Button25() {
  return (
    <div className="absolute h-[716.36px] left-[384px] right-0 top-[1928.72px]" data-name="Button">
      <Picture7 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[552px] tracking-[1.8px] translate-y-[-50%] uppercase w-[152.73px]">
        <p className="leading-[16px]">CULTURE / GOURMET</p>
      </div>
      <Link42 />
      <Container71 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[677.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月1日</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="absolute h-[2661.08px] left-[736px] right-0 top-0" data-name="Container" data-scroll-section="3">
      <Button20 />
      <IframeAdvertisementHtmlBody3 />
      <Button21 />
      <Button22 />
      <Button23 />
      <IframeAdvertisement4 />
      <Button24 />
      <Button25 />
    </div>
  );
}

function Container73() {
  return (
    <div className="absolute h-[2661.08px] left-[64px] right-[64px] top-[93.69px]" data-name="Container">
      <div className="absolute bottom-0 left-0 pointer-events-none right-[768px] top-0">
        <Container62 />
      </div>
      <Container72 />
    </div>
  );
}

function Container74() {
  return (
    <div className="absolute h-[2754.77px] left-[40px] right-[40px] top-[8620.61px]" data-name="Container">
      <Border5 />
      <Container73 />
    </div>
  );
}

function Img() {
  return (
    <div className="absolute left-[calc(50%-12px)] size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Img">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Img">
          <path d={svgPaths.p90717c0} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Img1() {
  return (
    <div className="absolute left-[calc(50%+12px)] size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Img">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Img">
          <path d={svgPaths.p90717c0} fill="var(--fill-0, #E0E0E0)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Footer2() {
  return (
    <div className="absolute h-[24px] left-[64px] right-[64px] top-[calc(50%+333.64px)] translate-y-[-50%]" data-name="Footer">
      <Img />
      <Img1 />
    </div>
  );
}

function Svg() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG" opacity="0.2">
          <path d="M16 21L7 12L16 3" id="Vector" stroke="var(--stroke-0, black)" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function ButtonPreviousSlide() {
  return (
    <div className="absolute left-[1408px] size-[24px] top-[calc(50%-0.01px)] translate-y-[-50%]" data-name="Button - Previous Slide">
      <Svg />
    </div>
  );
}

function Svg1() {
  return (
    <div className="absolute left-0 size-[24px] top-0" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="SVG">
          <path clipRule="evenodd" d={svgPaths.pde1b580} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonNextSlide() {
  return (
    <div className="absolute left-[1448px] size-[24px] top-[calc(50%-0.01px)] translate-y-[-50%]" data-name="Button - Next Slide">
      <Svg1 />
    </div>
  );
}

function Header() {
  return (
    <div className="absolute h-[23.69px] left-[64px] right-[64px] top-0" data-name="Header">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[23.69px] justify-center leading-[0] left-0 not-italic text-[22px] text-black top-[11.85px] tracking-[1.8px] translate-y-[-50%] uppercase w-[220.7px]">
        <p className="leading-[23.69px]">Osaka Expo 2025</p>
      </div>
      <ButtonPreviousSlide />
      <ButtonNextSlide />
    </div>
  );
}

function Picture18() {
  return (
    <div className="absolute aspect-[441.59/331.19] left-0 right-0 top-0" data-name="Picture → 大阪・関��万博のフランス館の見どころをレポート！ ルイ・ヴィトン、ディオール、ショーメが魅せる“���本とのつながり”">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates exercise" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(16)} />
      </div>
    </div>
  );
}

function Link43() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[371.19px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[495.192px]">
        <p className="mb-0">大阪・関西万博のフランス館の見どころをレポート！ ルイ・</p>
        <p>ヴィトン、ディオール、ショーメが魅せる“日本とのつながり”</p>
      </div>
    </div>
  );
}

function ItemButton() {
  return (
    <div className="absolute h-[463.19px] left-0 right-[1030.41px] top-0" data-name="Item → Button">
      <Picture18 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[355.19px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link43 />
    </div>
  );
}

function Picture19() {
  return (
    <div className="absolute aspect-[441.59/331.19] left-0 right-0 top-0" data-name="Picture → ショーメが大阪・関西万博に登場！「自然美」への愛を辿るエキシビションの全貌とは？">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness training" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(17)} />
      </div>
    </div>
  );
}

function Link44() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[371.19px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[479.49px]">
        <p className="mb-0">ショーメが大阪・関西万博に登場！「自然美」への愛を辿る</p>
        <p>エキシビションの全貌とは？</p>
      </div>
    </div>
  );
}

function ItemButton1() {
  return (
    <div className="absolute h-[463.19px] left-[457.59px] right-[572.82px] top-0" data-name="Item → Button">
      <Picture19 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[355.19px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link44 />
    </div>
  );
}

function Picture28() {
  return (
    <div className="absolute aspect-[441.59/441.59] left-0 right-0 top-0" data-name="Picture → 大阪・関西万博の英国パビリオン、「リバティ」の150周年を記念した展覧会が9月12日まで開催中！美しいテキスタイル展の見どころを解説">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman sport" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(18)} />
      </div>
    </div>
  );
}

function Link45() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[481.6px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[-0.225px] translate-y-[-50%] w-[490.477px]">
        <p className="mb-0">大阪・関西万博の英国パビリオン、「リバティ」の150周年を</p>
        <p className="mb-0">記念した展覧会が9月12日まで開催中！美しいテキスタイ</p>
        <p>ル展の見どころを解説</p>
      </div>
    </div>
  );
}

function ItemButton2() {
  return (
    <div className="absolute h-[595.59px] left-[915.19px] right-[115.22px] top-0" data-name="Item → Button">
      <Picture28 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[465.6px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link45 />
    </div>
  );
}

function Picture27() {
  return (
    <div className="absolute aspect-[441.59/441.59] left-0 right-0 top-0" data-name="Picture → ショーメ、「ビー ドゥ ショーメ」限定コードブレスレット発売。大阪・関西万博2025フランス館展覧会を記念">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(19)} />
      </div>
    </div>
  );
}

function Link46() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[481.6px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[521.911px]">
        <p className="mb-0">ショーメ、「ビー ドゥ ショーメ」限定コードブレスレット発売。</p>
        <p>大阪・関西万博2025フランス館展覧会を記念</p>
      </div>
    </div>
  );
}

function ItemButton3() {
  return (
    <div className="absolute h-[573.59px] left-[1372.78px] right-[-342.37px] top-0" data-name="Item → Button">
      <Picture27 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[465.6px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link46 />
    </div>
  );
}

function Picture21() {
  return (
    <div className="absolute aspect-[441.59/441.59] left-0 right-0 top-0" data-name="Picture → 山下智久が大阪・関西万博のフランス館へ！ ディオールが魅せる“日本とのつながり”を体験">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman active" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(20)} />
      </div>
    </div>
  );
}

function Link47() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[481.6px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[-0.225px] translate-y-[-50%] w-[464.587px]">
        <p className="mb-0">山下智久が大阪・関西万博のフランス館へ！ ディオールが</p>
        <p>魅せる“日本とのつながり”を体験</p>
      </div>
    </div>
  );
}

function ItemButton4() {
  return (
    <div className="absolute h-[573.59px] left-[1830.38px] right-[-799.97px] top-0" data-name="Item → Button">
      <Picture21 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[465.6px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link47 />
    </div>
  );
}

function PicturemyView1() {
  return (
    <div className="absolute aspect-[441.59/441.59] left-0 right-0 top-0" data-name="Picture → 万博に見る循環型建築の未来【MY VIEW｜永山祐子】">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(21)} />
      </div>
    </div>
  );
}

function Link48() {
  return (
    <div className="absolute h-[22px] left-0 right-0 top-[481.6px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[22px] justify-center leading-[0] left-0 text-[18px] text-black top-[11px] tracking-[-0.225px] translate-y-[-50%] w-[426.326px]">
        <p className="leading-[22px]">万博に見る循環型建築の未来【MY VIEW｜永山祐子】</p>
      </div>
    </div>
  );
}

function ItemButton5() {
  return (
    <div className="absolute h-[551.59px] left-[2287.97px] right-[-1257.56px] top-0" data-name="Item → Button">
      <PicturemyView1 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[465.6px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link48 />
    </div>
  );
}

function List() {
  return (
    <div className="absolute h-[595.59px] left-[64px] overflow-x-auto overflow-y-clip right-[64px] top-[47.68px]" data-name="List">
      <ItemButton />
      <ItemButton1 />
      <ItemButton2 />
      <ItemButton3 />
      <ItemButton4 />
      <ItemButton5 />
    </div>
  );
}

function Section() {
  return (
    <div className="absolute h-[691.28px] left-[40px] right-[40px] top-[11431.4px]" data-name="Section">
      <Footer2 />
      <Header />
      <List />
    </div>
  );
}

function Border6() {
  return (
    <div className="absolute h-[61.69px] left-[64px] right-[64px] top-0" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[23.69px] justify-center leading-[0] left-0 not-italic text-[21.3px] text-black top-[28.85px] tracking-[1.8px] translate-y-[-50%] uppercase w-[329.72px]">
        <p className="leading-[23.69px]">Vogue Japan Latest Issue</p>
      </div>
    </div>
  );
}

function Picture22() {
  return (
    <div className="absolute aspect-[1472/2056.19] left-0 right-0 top-0" data-name="Picture → ロール・プレイ">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman fitness lifestyle" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(22)} />
      </div>
    </div>
  );
}

function Link49() {
  return (
    <div className="absolute h-[44.8px] left-0 right-0 top-[2096.19px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[44.8px] justify-center leading-[0] left-0 text-[32px] text-black top-[22.4px] tracking-[0.8px] translate-y-[-50%] w-[228.932px]">
        <p className="leading-[44.8px]">ロール・プレイ</p>
      </div>
    </div>
  );
}

function Button26() {
  return (
    <div className="absolute inset-[93.68px_64px_32.01px_64px]" data-name="Button">
      <Picture22 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[2080.19px] tracking-[1.8px] translate-y-[-50%] uppercase w-[77.7px]">
        <p className="leading-[16px]">Magazine</p>
      </div>
      <Link49 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[2163.99px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年10月22日</p>
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="absolute inset-[12258.7px_40px_1716.09px_40px]" data-name="Container">
      <Border6 />
      <Button26 />
    </div>
  );
}

function Border7() {
  return (
    <div className="absolute h-[61.69px] left-[104px] right-[104px] top-[14643.3px]" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[23.69px] justify-center leading-[0] left-0 not-italic text-[22px] text-black top-[28.85px] tracking-[1.8px] translate-y-[-50%] uppercase w-[117.36px]">
        <p className="leading-[23.69px]">Wedding</p>
      </div>
    </div>
  );
}

function Picture20() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → 「互いに欠点があることを認め、相手を変えようとせずに受け入れること」──結婚20年以上のカップルから学ぶ、夫婦円満の秘訣">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman sport fashion" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(23)} />
      </div>
    </div>
  );
}

function Link50() {
  return (
    <div className="absolute h-[88px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[92px] justify-center leading-[22px] left-0 text-[18px] text-black top-[44px] tracking-[0.675px] translate-y-[-50%] w-[372.905px]">
        <p className="mb-0">「互いに欠点があることを認め、相手を変え</p>
        <p className="mb-0">ようとせずに受け入れること」──結婚20</p>
        <p className="mb-0">年以上の���ップルから学ぶ、夫婦円満の秘</p>
        <p>訣</p>
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[488px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[121.45px]">
        <p className="leading-[16.36px]">By Daisy Jones</p>
      </div>
    </div>
  );
}

function Button27() {
  return (
    <div className="absolute bottom-0 left-0 right-[1128px] top-0" data-name="Button">
      <Picture20 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[149.31px]">
        <p className="leading-[16px]">WEDDING / FEATURE</p>
      </div>
      <Link50 />
      <Container76 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[515.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月15日</p>
      </div>
    </div>
  );
}

function Picture23() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → ショーメがブライダルフェアを開催。ジュエリーボックスの特別なパーソナライズサービスも">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(24)} />
      </div>
    </div>
  );
}

function Link51() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[370.242px]">
        <p className="mb-0">ショーメがブライダルフェアを開催。ジュエ</p>
        <p className="mb-0">リーボックスの特別なパーソナライズサー</p>
        <p>ビスも</p>
      </div>
    </div>
  );
}

function Container77() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[272.03px]">
        <p className="leading-[16.36px]">
          By MAKIKO AWATA<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>MAYUMI NUMAO
        </p>
      </div>
    </div>
  );
}

function Button28() {
  return (
    <div className="absolute bottom-0 left-[376px] right-[752px] top-0" data-name="Button">
      <Picture23 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[129.79px]">
        <p className="leading-[16px]">WEDDING / NEWS</p>
      </div>
      <Link51 />
      <Container77 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[493.36px] tracking-[-0.1px] translate-y-[-50%] w-[89.968px]">
        <p className="leading-[14px]">2025年11月12日</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="absolute h-[344px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute left-0 size-[344px] top-0" data-name="Image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ImageWithFallback alt="Woman pilates fitness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(34)} />
        </div>
      </div>
    </div>
  );
}

function Link52() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-0" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[0.675px] translate-y-[-50%] w-[337.45px]">
        <p className="mb-0">2WAYできるミニマルなバッグを、小粋</p>
        <p>に携えて</p>
      </div>
    </div>
  );
}

function Container79() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[387.32px]" data-name="Container">
      <Link52 />
    </div>
  );
}

function HtmlBody5() {
  return (
    <div className="absolute h-[482.33px] left-0 right-0 top-0" data-name="Html → Body">
      <Container78 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[13px] justify-center leading-[0] left-0 text-[13px] text-black top-[368.5px] tracking-[1.95px] translate-y-[-50%] uppercase w-[97.33px]">
        <p className="leading-[17.33px]">Promotion</p>
      </div>
      <Container79 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[11px] text-black top-[476.32px] tracking-[1.8px] translate-y-[-50%] uppercase w-[17.04px]">
        <p className="leading-[12px]">By</p>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-[21.84px] text-[11px] text-black top-[476.32px] tracking-[1.8px] translate-y-[-50%] uppercase w-[85.89px]">
        <p className="leading-[12px]">LORO PIANA</p>
      </div>
      <div className="absolute bg-repeat bg-size-[43px_22px] bg-top-left bottom-[0.33px] right-0 size-[100px]" data-name="Image" style={{ backgroundImage: `url('${getImage(25)}')` }} />
    </div>
  );
}

function IframeAdvertisement5() {
  return (
    <div className="absolute h-[482px] left-[calc(50%+188px)] overflow-clip top-0 translate-x-[-50%] w-[344px]" data-name="Iframe - Advertisement">
      <HtmlBody5 />
    </div>
  );
}

function Picture3() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → 3日間にわたる、ジバンシィ家のウエディングに密着">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman active lifestyle" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(26)} />
      </div>
    </div>
  );
}

function Svg2() {
  return (
    <div className="absolute bottom-[12px] left-[13px] top-[12px] w-[24px]" data-name="SVG">
      <div className="absolute inset-[20.83%_12.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 14">
          <path clipRule="evenodd" d={svgPaths.p3a237400} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Overlay() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.85)] bottom-[218.36px] left-[8px] rounded-[24px] size-[48px]" data-name="Overlay">
      <Svg2 />
    </div>
  );
}

function Link53() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[0.675px] translate-y-[-50%] w-[363.75px]">
        <p className="mb-0">3日間にわたる、ジバンシィ家のウエディン</p>
        <p>グに密着</p>
      </div>
    </div>
  );
}

function Container80() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[444px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[176.5px]">
        <p className="leading-[16.36px]">By ALEXANDRA MACON</p>
      </div>
    </div>
  );
}

function Button29() {
  return (
    <div className="absolute bottom-0 left-[1128px] right-0 top-0" data-name="Button">
      <Picture3 />
      <Overlay />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[149.31px]">
        <p className="leading-[16px]">WEDDING / FEATURE</p>
      </div>
      <Link53 />
      <Container80 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[471.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年11月8日</p>
      </div>
    </div>
  );
}

function Container81() {
  return (
    <div className="absolute h-[554.36px] left-[104px] right-[104px] top-[14737px]" data-name="Container">
      <Button27 />
      <Button28 />
      <IframeAdvertisement5 />
      <Button29 />
    </div>
  );
}

function Border8() {
  return (
    <div className="absolute h-[61.69px] left-[104px] right-[104px] top-[15403.4px]" data-name="Border">
      <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[23.69px] justify-center leading-[0] left-0 not-italic text-[22px] text-black top-[28.85px] tracking-[1.8px] translate-y-[-50%] uppercase w-[160.36px]">
        <p className="leading-[23.69px]">VOGUE SHOP</p>
      </div>
    </div>
  );
}

function PictureVogueCollectionPeliAyako() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → サポーター第二弾！ VOGUE collectionのプライド月間チャリティ企画にPELI & AYAKOらも賛同">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(27)} />
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="absolute bottom-[12px] left-[13px] top-[12px] w-[24px]" data-name="SVG">
      <div className="absolute inset-[20.83%_12.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 14">
          <path clipRule="evenodd" d={svgPaths.p3a237400} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Overlay1() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.85)] bottom-[196.36px] left-[8px] rounded-[24px] size-[48px]" data-name="Overlay">
      <Svg3 />
    </div>
  );
}

function Link54() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[350.654px]">
        <p className="mb-0">サポーター第二弾！ VOGUE collectionの</p>
        <p className="mb-0">{`プライド月間チャリティ企画にPELI &`}</p>
        <p>AYAKOらも賛同</p>
      </div>
    </div>
  );
}

function Container82() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[338.86px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By Kanako Kobayashi<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>Yusuke Matsuyama
        </p>
      </div>
    </div>
  );
}

function Button30() {
  return (
    <div className="absolute bottom-0 left-0 right-[1128px] top-0" data-name="Button">
      <PictureVogueCollectionPeliAyako />
      <Overlay1 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link54 />
      <Container82 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[493.36px] tracking-[-0.1px] translate-y-[-50%] w-[76.457px]">
        <p className="leading-[14px]">2025年6月9日</p>
      </div>
    </div>
  );
}

function Picturevoguet() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → ダイ&シュンも『VOGUE』Tシャツを着てサポート！プライド月間チャリティ企画に賛同する豪華な面々の着こなしをチェック">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(28)} />
      </div>
    </div>
  );
}

function Svg4() {
  return (
    <div className="absolute bottom-[12px] left-[13px] top-[12px] w-[24px]" data-name="SVG">
      <div className="absolute inset-[20.83%_12.5%]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 14">
          <path clipRule="evenodd" d={svgPaths.p3a237400} fill="var(--fill-0, black)" fillRule="evenodd" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Overlay2() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.85)] bottom-[196.36px] left-[8px] rounded-[24px] size-[48px]" data-name="Overlay">
      <Svg4 />
    </div>
  );
}

function Link55() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[371.67px]">
        <p className="mb-0">{`ダ���&シュン���『VOGUE』Tシャツを着てサ`}</p>
        <p className="mb-0">ポート！プライド月間チャリティ企画に賛同</p>
        <p>する豪華な面々の着こなしをチェック</p>
      </div>
    </div>
  );
}

function Container83() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[338.86px]">
        <p className="leading-[16.36px] text-[11.8px]">
          By Kanako Kobayashi<span className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold">、</span>Yusuke Matsuyama
        </p>
      </div>
    </div>
  );
}

function Button31() {
  return (
    <div className="absolute bottom-0 left-[376px] right-[752px] top-0" data-name="Button">
      <Picturevoguet />
      <Overlay2 />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.1px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[199.36px]">
        <p className="leading-[16px] whitespace-nowrap">{`LIFESTYLE / CULTURE & LIFE`}</p>
      </div>
      <Link55 />
      <Container83 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[493.36px] tracking-[-0.1px] translate-y-[-50%] w-[76.457px]">
        <p className="leading-[14px]">2025年6月2日</p>
      </div>
    </div>
  );
}

function Container84() {
  return (
    <div className="absolute h-[344px] left-0 overflow-clip right-0 top-0" data-name="Container">
      <div className="absolute left-0 size-[344px] top-0" data-name="Image">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ImageWithFallback alt="Woman yoga exercise" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(35)} />
        </div>
      </div>
    </div>
  );
}

function Link56() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-0" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[42px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[0.675px] translate-y-[-50%] w-[342.26px]">
        <p className="mb-0">スウェーデン発のブランド、トーテムが</p>
        <p>東京に響かせる静謐な美</p>
      </div>
    </div>
  );
}

function Container85() {
  return (
    <div className="absolute h-[44px] left-0 overflow-clip right-0 top-[387.33px]" data-name="Container">
      <Link56 />
    </div>
  );
}

function HtmlBody6() {
  return (
    <div className="absolute h-[482.33px] left-0 right-0 top-0" data-name="Html → Body">
      <Container84 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[13px] justify-center leading-[0] left-0 text-[13px] text-black top-[368.5px] tracking-[1.95px] translate-y-[-50%] uppercase w-[97.33px]">
        <p className="leading-[17.33px]">Promotion</p>
      </div>
      <Container85 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-0 text-[11px] text-black top-[476.33px] tracking-[1.8px] translate-y-[-50%] uppercase w-[17.04px]">
        <p className="leading-[12px]">By</p>
      </div>
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Bold',sans-serif] font-bold h-[12px] justify-center leading-[0] left-[21.84px] text-[10.5px] text-black top-[476.33px] tracking-[1.8px] translate-y-[-50%] uppercase w-[51.61px]">
        <p className="leading-[12px]">TOTEME</p>
      </div>
    </div>
  );
}

function IframeAdvertisement6() {
  return (
    <div className="absolute h-[482px] left-[calc(50%+188px)] overflow-clip top-0 translate-x-[-50%] w-[344px]" data-name="Iframe - Advertisement">
      <HtmlBody6 />
    </div>
  );
}

function PicturevogueCollection() {
  return (
    <div className="absolute aspect-[344/344] left-0 right-0 top-0" data-name="Picture → ダリのアートをモードに纏う。「VOGUE Collection」で大人気のアーカイブ表紙プリントから、新作アイテムが登場">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman pilates" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(30)} />
      </div>
    </div>
  );
}

function Link57() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[353.801px]">
        <p className="mb-0">ダリのアートをモードに纏う。「VOGUE</p>
        <p className="mb-0">Collection」で大人気のアーカイブ表紙プ</p>
        <p>リントから、新作アイテムが登場</p>
      </div>
    </div>
  );
}

function Container86() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[11.8px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[163.97px]">
        <p className="leading-[16.36px]">By MISAKI YAMASHITA</p>
      </div>
    </div>
  );
}

function Button32() {
  return (
    <div className="absolute bottom-0 left-[1128px] right-0 top-0" data-name="Button">
      <PicturevogueCollection />
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[368px] tracking-[1.8px] translate-y-[-50%] uppercase w-[122.72px]">
        <p className="leading-[16px]">FASHION / NEWS</p>
      </div>
      <Link57 />
      <Container86 />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-0 text-[12px] text-black top-[493.36px] tracking-[-0.1px] translate-y-[-50%] w-[83.218px]">
        <p className="leading-[14px]">2025年3月28日</p>
      </div>
    </div>
  );
}

function Container87() {
  return (
    <div className="absolute h-[532.36px] left-[104px] right-[104px] top-[15497.1px]" data-name="Container">
      <Button30 />
      <Button31 />
      <IframeAdvertisement6 />
      <Button32 />
    </div>
  );
}

function Main({ onArticleClick }: { onArticleClick?: () => void }) {
  return (
    <div className="relative left-0 right-0 mt-[220px] max-md:mt-[60px]" data-name="Main">
      {/* RECENT POSTS セクション */}
      <div className="relative h-[1244.03px] mx-[40px] mt-0 mb-[463.97px] max-md:mx-[20px] max-md:h-auto max-md:mb-20">
        <Container5Inner onArticleClick={onArticleClick} />
      </div>
      
      <Background />
      
      {/* スペーサー */}
      <div className="h-[120px]" />
      
      {/* YOGA セクション */}
      <TwoColumnScrollSection title="YOGA" height={1600} marginBottom={0} />
      
      {/* PILATES セクション */}
      <TwoColumnScrollSection title="PILATES" height={1600} marginBottom={0} />
      
      {/* DIET セクション */}
      <TwoColumnScrollSection title="DIET" height={1600} marginBottom={0} />
      
      {/* JOB セクション */}
      <TwoColumnScrollSection title="JOB" height={1600} marginBottom={0} />
      
      {/* BEAUTY セクション */}
      <TwoColumnScrollSection title="BEAUTY" height={1600} marginBottom={0} />
      
      {/* LIFE セクション */}
      <TwoColumnScrollSection title="LIFE" height={1600} marginBottom={0} />
      
      {/* SPORTS - 4カラムレイアウト */}
      <FourColumnSection 
        title="SPORTS" 
        categories={[
          { index: 16, category: "RUNNING" },
          { index: 17, category: "TRAINING" },
          { index: 18, category: "CYCLING" },
          { index: 19, category: "SWIMMING" }
        ]}
        marginBottom={125}
      />
      
      {/* SIDE BUSINESS - 4カラムレイアウト */}
      <FourColumnSection 
        title="SIDE BUSINESS" 
        categories={[
          { index: 20, category: "FREELANCE" },
          { index: 21, category: "CONSULTING" },
          { index: 22, category: "ONLINE SHOP" },
          { index: 6, category: "INVESTMENT" }
        ]}
        marginBottom={125}
      />
      
      {/* SKILLS - 4カラムレイアウト */}
      <FourColumnSection 
        title="SKILLS" 
        categories={[
          { index: 7, category: "PROGRAMMING" },
          { index: 8, category: "DESIGN" },
          { index: 12, category: "MARKETING" },
          { index: 13, category: "MANAGEMENT" }
        ]}
        marginBottom={200}
      />
    </div>
  );
}

// 2カラムスクロールセクションコンポーネント（2段階スクロール対応）
function TwoColumnScrollSection({ 
  title, 
  height, 
  marginBottom,
  topMargin = 0
}: { 
  title: string; 
  height: number; 
  marginBottom: number;
  topMargin?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [calculatedHeight, setCalculatedHeight] = useState(height);
  const isScrollCompleteRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateHeight = () => {
      if (!rightColumnRef.current) return;
      
      const headerHeight = 112;
      const titleHeight = 60;
      // 右カラムの実際の高さを自動取得
      const rightColumnHeight = rightColumnRef.current.scrollHeight;
      const viewportHeight = window.innerHeight;
      const visibleHeight = viewportHeight - headerHeight - titleHeight;
      const scrollableDistance = Math.max(0, rightColumnHeight - visibleHeight);
      // セクションの高さ = タイトル高さ + スクロール可能距離
      const newHeight = titleHeight + scrollableDistance;
      setCalculatedHeight(newHeight);
    };

    // 初回計算を少し遅延（DOMの描画完了を待つ）
    const timer = setTimeout(calculateHeight, 100);
    window.addEventListener('resize', calculateHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateHeight);
    };
  }, []);

  // スムーズなスクロールジャック
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWheel = (e: WheelEvent) => {
      if (!sectionRef.current) return;

      const section = sectionRef.current;
      const sectionRect = section.getBoundingClientRect();
      
      const headerHeight = 112;
      const titleHeight = 60;
      // 右カラムの実際の高さを自動取得
      const rightColumnHeight = rightColumnRef.current?.scrollHeight || 0;
      const viewportHeight = window.innerHeight;
      const visibleHeight = viewportHeight - headerHeight - titleHeight;
      const scrollableDistance = Math.max(0, rightColumnHeight - visibleHeight);

      // Border2（タイトル）の上端がヘッダーの下に来る位置でスクロールジャックを発動
      // セクションの上端 = Border2の上端
      const targetPosition = headerHeight;
      const isInSection = sectionRect.top <= targetPosition && sectionRect.bottom > viewportHeight;
      
      // セクション内で右カラムにスクロール可能な距離がある場合
      if (isInSection && scrollableDistance > 0) {
        const delta = e.deltaY;
        const newOffset = scrollOffset + delta;

        // 下方向スクロール
        if (delta > 0) {
          if (scrollOffset < scrollableDistance) {
            // まだ右カラムがスクロール可能ならpreventして右カラムをスクロール
            e.preventDefault();
            const finalOffset = Math.min(scrollableDistance, newOffset);
            setScrollOffset(finalOffset);
            
            // 最後まで到達したらフラグを立てる
            if (finalOffset >= scrollableDistance) {
              isScrollCompleteRef.current = true;
            }
          }
          // scrollOffset >= scrollableDistanceなら何もせず、通常のページスクロール
        }
        // 上方向スクロール
        else if (delta < 0) {
          if (scrollOffset > 0) {
            // まだ右カラムが戻せるならpreventして右カラムを逆スクロール
            e.preventDefault();
            setScrollOffset(Math.max(0, newOffset));
            
            // フラグをリセット
            isScrollCompleteRef.current = false;
          }
          // scrollOffset = 0なら何もせず、通常のページスクロール（セクションから抜ける）
        }
      }
      
      // セクションから離れたらフラグをリセット
      if (!isInSection) {
        isScrollCompleteRef.current = false;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scrollOffset]);

  return (
    <div 
      ref={sectionRef}
      className="relative mx-[40px] two-column-scroll-section max-md:mx-[20px] max-md:h-auto max-md:mb-20" 
      style={{ 
        height: `${calculatedHeight}px`, 
        marginBottom: `${marginBottom}px`,
        marginTop: topMargin > 0 ? `${topMargin}px` : undefined
      }}
    >
      <div 
        className="sticky z-20 bg-white max-md:relative max-md:z-0 max-md:bg-transparent" 
        style={{ top: '92px' }}
      >
        <Border2 title={title} />
      </div>

      <div className="relative h-[1906.72px] overflow-hidden max-md:h-auto max-md:overflow-visible">
        <div className="absolute left-[64px] right-[832px] top-0 h-full max-md:hidden">
          <Container19 />
        </div>
        
        <div 
          ref={rightColumnRef}
          className="absolute h-[1906.72px] left-[800px] right-[64px] top-0 max-md:!relative max-md:!h-auto max-md:!left-0 max-md:!right-0 max-md:grid max-md:grid-cols-2 max-md:gap-[16px]"
          style={{
            transform: `translateY(-${scrollOffset}px)`,
            willChange: 'transform'
          }}
        >
          <div className="hidden max-md:block max-md:col-span-2">
            <ButtonMain />
          </div>
          <Button7 />
          <Button9 />
          <Button11A />
          <Button8 />
          <Button10 />
          <Button12A />
        </div>
      </div>
    </div>
  );
}

// 4カラムセクションコンポーネント
function FourColumnSection({ 
  title, 
  categories, 
  marginBottom 
}: { 
  title: string; 
  categories: Array<{ index: number; category: string }>; 
  marginBottom: number;
}) {
  return (
    <div 
      className="relative mx-[40px] max-md:mx-[20px] max-md:mb-20" 
      style={{ marginBottom: marginBottom > 0 ? `${marginBottom}px` : undefined }}
    >
      <Border2 title={title} />
      <Container4Column categories={categories} />
    </div>
  );
}

// Container5の内容を抽��
function Container5Inner({ onArticleClick }: { onArticleClick?: () => void }) {
  return (
    <>
      <Border />
      <div className="md:contents max-md:grid max-md:grid-cols-2 max-md:gap-[16px] max-md:mt-20">
        <Button onClick={onArticleClick} />
        <Button1 onClick={onArticleClick} />
        <Button2 onClick={onArticleClick} />
        <Button3 onClick={onArticleClick} />
        <Button4 onClick={onArticleClick} />
      </div>
    </>
  );
}

// Container29の内容を抽出
function Container29Inner() {
  return (
    <>
      <Border2 title="YOGA & PILATES" />
      <Container28 />
    </>
  );
}

function LogoReverseSvg() {
  return (
    <div className="absolute h-[150px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] w-[582px]" data-name="logo-reverse.svg">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 582 150">
        <g clipPath="url(#clip0_1_696)" id="logo-reverse.svg">
          <path clipRule="evenodd" d={svgPaths.p2a116730} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_696">
            <rect fill="white" height="150" width="582" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function LogoReverseSvgFill() {
  return (
    <div className="absolute h-[31.98px] left-0 overflow-clip top-0 w-[124.16px]" data-name="logo-reverse.svg fill">
      <LogoReverseSvg />
    </div>
  );
}

function Vogue() {
  return (
    <div className="absolute aspect-[124.16/31.98] bottom-0 left-0 overflow-clip top-0" data-name="Vogue">
      <LogoReverseSvgFill />
    </div>
  );
}

function Picture24() {
  return (
    <div className="absolute bottom-0 left-0 overflow-clip top-0 w-[432px]" data-name="Picture">
      <Vogue />
    </div>
  );
}

function Link58() {
  return (
    <div className="absolute h-[31.98px] left-0 right-[1040px] top-[48px]" data-name="Link">
      <Picture24 />
    </div>
  );
}

function Svg5() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p10b9d300} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkLine() {
  return (
    <div className="absolute left-0 rounded-[24px] size-[48px] top-0" data-name="Item → Link - Line">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg5 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path clipRule="evenodd" d={svgPaths.p375ba000} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkYouTube() {
  return (
    <div className="absolute left-[64px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - YouTube">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg6 />
    </div>
  );
}

function Svg7() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p3c67e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkFollowUsOnX() {
  return (
    <div className="absolute left-[128px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - Follow us on X">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg7 />
    </div>
  );
}

function Svg8() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path clipRule="evenodd" d={svgPaths.p9830500} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkInstagram() {
  return (
    <div className="absolute left-[192px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - Instagram">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg8 />
    </div>
  );
}

function Svg9() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p379cd800} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkFacebook() {
  return (
    <div className="absolute left-[256px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - Facebook">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg9 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p7333000} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkPinterest() {
  return (
    <div className="absolute left-[320px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - Pinterest">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg10 />
    </div>
  );
}

function Svg11() {
  return (
    <div className="absolute inset-[8px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="SVG">
          <path d={svgPaths.p3bd15b80} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ItemLinkTikTok() {
  return (
    <div className="absolute left-[384px] rounded-[24px] size-[48px] top-0" data-name="Item → Link - TikTok">
      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[24px]" />
      <Svg11 />
    </div>
  );
}

function List1() {
  return (
    <div className="absolute h-[64px] left-0 right-[1040px] top-[119.99px]" data-name="List">
      <ItemLinkLine />
      <ItemLinkYouTube />
      <ItemLinkFollowUsOnX />
      <ItemLinkInstagram />
      <ItemLinkFacebook />
      <ItemLinkPinterest />
      <ItemLinkTikTok />
    </div>
  );
}

function ItemLink() {
  return (
    <div className="absolute bottom-[320px] left-0 top-0 w-[61.25px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[61.638px]">
        <p className="leading-[36px]">Fashion</p>
      </div>
    </div>
  );
}

function ItemLink1() {
  return (
    <div className="absolute bottom-[280px] left-0 top-[40px] w-[53.34px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[53.704px]">
        <p className="leading-[36px]">Beauty</p>
      </div>
    </div>
  );
}

function ItemLink2() {
  return (
    <div className="absolute bottom-[240px] left-0 top-[80px] w-[74.75px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[75.065px]">
        <p className="leading-[36px]">Celebrity</p>
      </div>
    </div>
  );
}

function ItemLink3() {
  return (
    <div className="absolute bottom-[200px] left-0 top-[120px] w-[71.59px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[71.9px]">
        <p className="leading-[36px]">Lifestyle</p>
      </div>
    </div>
  );
}

function ItemLink4() {
  return (
    <div className="absolute bottom-[160px] left-0 top-[160px] w-[58.45px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[58.83px]">
        <p className="leading-[36px]">Runway</p>
      </div>
    </div>
  );
}

function ItemLink5() {
  return (
    <div className="absolute bottom-[120px] left-0 top-[200px] w-[86.08px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[86.413px]">
        <p className="leading-[36px]">Horoscope</p>
      </div>
    </div>
  );
}

function ItemLink6() {
  return (
    <div className="absolute bottom-[80px] left-0 top-[240px] w-[42.48px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[42.81px]">
        <p className="leading-[36px]">Video</p>
      </div>
    </div>
  );
}

function ItemLink7() {
  return (
    <div className="absolute bottom-[40px] left-0 top-[280px] w-[90.13px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[90.469px]">
        <p className="leading-[36px]">VOGUE SHOP</p>
      </div>
    </div>
  );
}

function ItemLink8() {
  return (
    <div className="absolute bottom-0 left-0 top-[320px] w-[95.55px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[95.898px]">
        <p className="leading-[36px]">PhotoVogue</p>
      </div>
    </div>
  );
}

function List2() {
  return (
    <div className="absolute h-[356px] left-0 right-0 top-[30.74px]" data-name="List">
      <ItemLink />
      <ItemLink1 />
      <ItemLink2 />
      <ItemLink3 />
      <ItemLink4 />
      <ItemLink5 />
      <ItemLink6 />
      <ItemLink7 />
      <ItemLink8 />
    </div>
  );
}

function NavSeeMoreStories() {
  return (
    <div className="absolute h-[386.73px] left-[752px] top-[48px] w-[142.03px]" data-name="Nav - SEE MORE STORIES">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[14.73px] justify-center leading-[0] left-0 not-italic text-[12.4px] text-white top-[7.36px] tracking-[1.662px] translate-y-[-50%] uppercase w-[142.23px]">
        <p className="leading-[14.73px]">SEE MORE STORIES</p>
      </div>
      <List2 />
    </div>
  );
}

function ItemLink9() {
  return (
    <div className="absolute bottom-[80px] left-0 top-0 w-[47.41px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[47.755px]">
        <p className="leading-[36px]">Vogue</p>
      </div>
    </div>
  );
}

function ItemLink10() {
  return (
    <div className="absolute bottom-[40px] left-0 top-[40px] w-[44.91px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[45.247px]">
        <p className="leading-[36px]">Wired</p>
      </div>
    </div>
  );
}

function ItemLink11() {
  return (
    <div className="absolute bottom-0 left-0 top-[80px] w-[20.27px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[12px] text-white top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[20.59px]">
        <p className="leading-[36px]">GQ</p>
      </div>
    </div>
  );
}

function List3() {
  return (
    <div className="absolute h-[116px] left-0 right-0 top-[30.74px]" data-name="List">
      <ItemLink9 />
      <ItemLink10 />
      <ItemLink11 />
    </div>
  );
}

function NavCondeNastJapan() {
  return (
    <div className="absolute h-[386.73px] left-[1128px] top-[48px] w-[156.16px]" data-name="Nav - Condé Nast Japan">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[14.73px] justify-center leading-[0] left-0 not-italic text-[13px] text-white top-[7.36px] tracking-[1.662px] translate-y-[-50%] uppercase w-[156.36px]">
        <p className="leading-[14.73px]">Condé Nast Japan</p>
      </div>
      <List3 />
    </div>
  );
}

function ItemLink12() {
  return (
    <div className="absolute h-[36px] left-0 top-[calc(50%-1px)] translate-y-[-50%] w-[172.78px]" data-name="Item → Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[173.114px]">
        <p className="leading-[36px]">利用規約と個人情報保護方針</p>
      </div>
    </div>
  );
}

function Link59() {
  return (
    <div className="absolute h-[36px] left-[12.78px] top-1/2 translate-y-[-50%] w-[78.89px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[79.212px]">
        <p className="leading-[36px]">お問い合わせ</p>
      </div>
    </div>
  );
}

function Item() {
  return (
    <div className="absolute h-[36px] left-[180.78px] top-[2px] w-[91.67px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link59 />
    </div>
  );
}

function Link60() {
  return (
    <div className="absolute h-[36px] left-[12.78px] top-1/2 translate-y-[-50%] w-[53.61px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[53.974px]">
        <p className="leading-[36px]">採用情報</p>
      </div>
    </div>
  );
}

function Item1() {
  return (
    <div className="absolute h-[36px] left-[280.45px] top-[2px] w-[66.39px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link60 />
    </div>
  );
}

function Link61() {
  return (
    <div className="absolute h-[36px] left-[12.79px] top-1/2 translate-y-[-50%] w-[53.61px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[53.974px]">
        <p className="leading-[36px]">広告掲載</p>
      </div>
    </div>
  );
}

function Item2() {
  return (
    <div className="absolute h-[36px] left-[354.84px] top-[2px] w-[66.39px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link61 />
    </div>
  );
}

function Link62() {
  return (
    <div className="absolute h-[36px] left-[12.79px] top-1/2 translate-y-[-50%] w-[114.88px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[115.258px]">
        <p className="leading-[36px]">VOGUE JAPAN ID</p>
      </div>
    </div>
  );
}

function Item3() {
  return (
    <div className="absolute h-[36px] left-[429.23px] top-[2px] w-[127.66px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link62 />
    </div>
  );
}

function Link63() {
  return (
    <div className="absolute h-[36px] left-[12.78px] top-1/2 translate-y-[-50%] w-[71.08px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[71.389px]">
        <p className="leading-[36px]">MAGAZINE</p>
      </div>
    </div>
  );
}

function Item4() {
  return (
    <div className="absolute h-[36px] left-[564.89px] top-[2px] w-[83.86px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link63 />
    </div>
  );
}

function Link64() {
  return (
    <div className="absolute h-[36px] left-[12.78px] top-1/2 translate-y-[-50%] w-[41.78px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[42.107px]">
        <p className="leading-[36px]">STAFF</p>
      </div>
    </div>
  );
}

function Item5() {
  return (
    <div className="absolute h-[36px] left-[656.75px] top-[2px] w-[54.56px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link64 />
    </div>
  );
}

function Link65() {
  return (
    <div className="absolute h-[36px] left-[12.78px] top-1/2 translate-y-[-50%] w-[64.64px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[17px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[17.5px] tracking-[1.4px] translate-y-[-50%] uppercase w-[65.039px]">
        <p className="leading-[36px]">Site Map</p>
      </div>
    </div>
  );
}

function Item6() {
  return (
    <div className="absolute h-[36px] left-[719.31px] top-[2px] w-[77.42px]" data-name="Item">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[36px] justify-center leading-[0] left-0 text-[#cbcbcb] text-[12px] top-[18px] tracking-[1.4px] translate-y-[-50%] uppercase w-[5.169px]">
        <p className="leading-[36px]">|</p>
      </div>
      <Link65 />
    </div>
  );
}

function ItemButton6() {
  return (
    <div className="absolute h-[38px] left-[804.73px] top-0 w-[191.53px]" data-name="Item → Button">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] left-[calc(50%-3.83px)] text-[#636363] text-[14px] text-center top-[19px] tracking-[1.193px] translate-x-[-50%] translate-y-[-50%] uppercase w-[183.873px]">
        <p className="leading-[14px]">Your Privacy Choices</p>
      </div>
    </div>
  );
}

function NavNoticesList() {
  return (
    <div className="absolute h-[42px] left-0 top-[47.5px] w-[996.27px]" data-name="Nav - Notices → List">
      <ItemLink12 />
      <Item />
      <Item1 />
      <Item2 />
      <Item3 />
      <Item4 />
      <Item5 />
      <Item6 />
      <ItemButton6 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="absolute h-[7px] left-[67.94px] top-[23px] w-[12px]" data-name="SVG">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
        <g id="SVG">
          <path clipRule="evenodd" d={svgPaths.pb3e300} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" stroke="var(--stroke-0, white)" strokeWidth="0.21875" />
        </g>
      </svg>
    </div>
  );
}

function ButtonMenu() {
  return (
    <div className="absolute h-[46px] left-[1375.06px] top-[42.5px] w-[96.94px]" data-name="Button menu">
      <div aria-hidden="true" className="absolute border border-[#1f1f1f] border-solid inset-0 pointer-events-none" />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[20px] justify-center leading-[0] left-[calc(50%-7.83px)] text-[16px] text-center text-white top-[23px] translate-x-[-50%] translate-y-[-50%] w-[47.284px]">
        <p className="leading-[20px]">Japan</p>
      </div>
      <Svg12 />
    </div>
  );
}

function Heading6MaskGroup() {
  return <div className="absolute left-[1375.06px] size-px top-[70.59px]" data-name="Heading 6:mask-group" />;
}

function HorizontalBorder() {
  return (
    <div className="absolute h-[185px] left-0 right-0 top-[466.74px]" data-name="HorizontalBorder">
      <div aria-hidden="true" className="absolute border-[#1f1f1f] border-[2px_0px_0px] border-solid inset-0 pointer-events-none" />
      <NavNoticesList />
      <div className="absolute flex flex-col font-['Noto_Sans_JP:DemiLight',sans-serif] font-[350] h-[16px] justify-center leading-[0] left-0 text-[#636363] text-[12px] top-[129px] tracking-[-0.2px] translate-y-[-50%] w-[787.484px]">
        <p className="leading-[16px]">© Condé Nast Japan ALL RIGHTS RESERVED | WEBサイト内の商品価格表示について、2021年4月1日以降は消費税込み総額表示に統一いたしました。</p>
      </div>
      <ButtonMenu />
      <Heading6MaskGroup />
    </div>
  );
}

function Container88() {
  return (
    <div className="absolute h-[651.73px] left-0 right-0 top-0" data-name="Container">
      <Link58 />
      <List1 />
      <NavSeeMoreStories />
      <NavCondeNastJapan />
      <HorizontalBorder />
    </div>
  );
}

// 新しいフッターコンポーネント
export function Footer() {
  return (
    <footer className="bg-black text-white py-16 max-md:py-12 w-full">
      <div className="max-w-[1552px] mx-auto px-[64px] max-md:px-[40px]">
        {/* ロゴセクション */}
        <div className="text-center max-md:text-left mb-14 max-md:mb-8">
          <img 
            src={footerLogoImage} 
            alt="RADIANCE Logo" 
            className="h-[50px] w-auto mx-auto max-md:mx-0 mb-3 max-md:mb-2 object-contain max-md:h-8"
          />
          <p className="text-[#777] text-[11px] max-md:text-[9px] tracking-[2.5px] max-md:tracking-[1.5px] uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">
            心と体を輝かせるライフスタイルマガジン
          </p>
        </div>

        {/* カテゴリーグリッド - PC版 */}
        <div className="mb-14 max-md:hidden">
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Yoga</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Pilates</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Diet</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Job</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Beauty</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Life</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Sports</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Side Business</a>
            <span className="text-[#444] text-[13px]">|</span>
            <a href="#" className="text-white hover:text-[#ccc] text-[13px] tracking-[2.5px] transition-all duration-300 font-['Noto_Sans_CJK_JP:Medium',sans-serif] uppercase border-b border-transparent hover:border-white pb-1">Skills</a>
          </div>
        </div>

        {/* カテゴリー - スマホ版（縦並び） */}
        <div className="hidden max-md:block mb-8">
          <h3 className="text-white text-[11px] tracking-[2px] uppercase font-['Noto_Sans_CJK_JP:Bold',sans-serif] mb-4">カテゴリー</h3>
          <div className="flex flex-col gap-3">
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Yoga</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Pilates</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Diet</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Job</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Beauty</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Life</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Sports</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Side Business</a>
            <a href="#" className="text-[#999] hover:text-white text-[12px] tracking-[1.5px] transition-colors uppercase font-['Noto_Sans_CJK_JP:Regular',sans-serif]">Skills</a>
          </div>
        </div>

        {/* ボーダーライン */}
        <div className="h-[1px] bg-[#333] mb-8 max-w-[800px] mx-auto max-md:mx-0 max-md:mb-6"></div>

        {/* 下部リンク */}
        <div className="flex justify-center items-center gap-8 mb-8 max-md:flex-col max-md:items-start max-md:gap-3 max-md:mb-6">
          <a href="#" className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-['Noto_Sans_JP:Regular',sans-serif]">お問い合わせ</a>
          <a href="#" className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-['Noto_Sans_JP:Regular',sans-serif]">運営会社</a>
          <a href="#" className="text-[#999] hover:text-white text-[12px] max-md:text-[11px] tracking-[1.5px] max-md:tracking-[1px] transition-colors uppercase font-['Noto_Sans_JP:Regular',sans-serif]">プライバシーポリシー</a>
        </div>

        {/* コピーライト */}
        <div className="text-center max-md:text-left">
          <p className="text-[#555] text-[11px] max-md:text-[10px] tracking-[2px] max-md:tracking-[1px] uppercase font-['Noto_Sans_JP:Light',sans-serif]">
            © 2025 Radiance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Container89({ onArticleClick }: ContainerProps = {}) {
  return (
    <div className="relative size-full" data-name="Container">
      <Button6 />
      <div className="absolute h-[160px] left-0 right-0 top-0" data-name="Rectangle" />
      <Main onArticleClick={onArticleClick} />
      <div className="relative left-0 right-0 mt-[80px] max-md:mt-20 mb-0 w-full">
        <Footer />
      </div>
    </div>
  );
}