"use client";

import { ImageWithFallback } from "../ImageWithFallback";

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

export function PicturefabFiveNew() {
  return (
    <div className="absolute left-0 size-[344px] top-0" data-name="Picture → ヨガで心身のバランスを整える──初心者から始める実践ガイド">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman practicing yoga" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(3)} />
      </div>
    </div>
  );
}

export function Link3New() {
  return (
    <div className="absolute h-[66px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[70px] justify-center leading-[22px] left-0 text-[18px] text-black top-[33px] tracking-[0.675px] translate-y-[-50%] w-[344px] overflow-hidden">
        <p className="mb-0">ヨガで心身のバランスを整える──初心者から</p>
        <p className="mb-0">始める実践ガイド</p>
      </div>
    </div>
  );
}

export function Container3New() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[466px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[0px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[344px] overflow-hidden text-ellipsis">
        <p className="leading-[16.36px] text-[11.8px]">
          By YUMI TANAKA
        </p>
      </div>
    </div>
  );
}

export function Picture5New() {
  return (
    <div className="absolute left-0 size-[344px] top-0" data-name="Picture → スポーツと美容を両立する──アクティブライフのためのセルフケア術">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ImageWithFallback alt="Woman wellness fitness" className="absolute left-0 max-w-none size-full top-0 object-cover" src={getImage(4)} />
      </div>
    </div>
  );
}

export function Link4New() {
  return (
    <div className="absolute h-[44px] left-0 right-0 top-[384px]" data-name="Link">
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[48px] justify-center leading-[22px] left-0 text-[18px] text-black top-[22px] tracking-[0.675px] translate-y-[-50%] w-[344px] overflow-hidden">
        <p className="mb-0">スポーツと美容を両立する──アクティブライ</p>
        <p>フのためのセルフケア術</p>
      </div>
    </div>
  );
}

export function Container4New() {
  return (
    <div className="absolute h-[16.36px] left-0 right-0 top-[444px]" data-name="Container">
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-0 not-italic text-[12px] text-black top-[8px] tracking-[1.964px] translate-y-[-50%] uppercase w-[344px] overflow-hidden text-ellipsis">
        <p className="leading-[16.36px]">
          By AYAKA SUZUKI
        </p>
      </div>
    </div>
  );
}