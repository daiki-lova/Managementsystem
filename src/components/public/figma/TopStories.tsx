"use client";

import { ImageWithFallback } from "./ImageWithFallback";

// スポーティな女性の画像URL
const sportImages = [
  "https://images.unsplash.com/photo-1610562269919-86791081ad29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBwb3NlfGVufDF8fHx8MTc2MzM4ODQ5NHww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBpbGF0ZXMlMjBleGVyY2lzZXxlbnwxfHx8fDE3NjM0MDMzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1525296416200-59aaed194d0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZpdG5lc3MlMjB3b3Jrb3V0fGVufDF8fHx8MTc2MzM5MzUzMXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1622206509367-cb16e7f50e69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJ1bm5pbmclMjBzcG9ydHxlbnwxfHx8fDE3NjM0NDU0Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1649888639789-b611bc359d9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHN0cmV0Y2hpbmclMjBhdGhsZXRpY3xlbnwxfHx8fDE3NjM0NDU0Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

const getImage = (index: number) => sportImages[index % sportImages.length];

interface Article {
  title: string[];
  category: string;
  author: string;
  date: string;
  imageIndex: number;
}

interface TopStoriesProps {
  onNavigate?: (page: string, category?: string) => void;
}

export default function TopStories({ onNavigate }: TopStoriesProps) {
  // メイン記事
  const mainArticle: Article = {
    title: ["心と体を整える──ヨガ＆ピラティスで", "理想のライフスタイルを手に入れる"],
    category: "FASHION / NEWS",
    author: "VOGUE",
    date: "2025年11月13日",
    imageIndex: 0,
  };

  // 4つのサブ記事（2x2グリッド）
  const subArticles: Article[] = [
    {
      title: ["ピラティスで体幹を強化! 美しい姿勢と", "スタイルを手に入れる"],
      category: "CELEBRITY / NEWS",
      author: "SAORI NAKADOZONO",
      date: "2025年11月13日",
      imageIndex: 1,
    },
    {
      title: ["フィットネスウェアの最新トレンド── 機能", "性とスタイルを兼ね備えた選び方"],
      category: "FASHION / TREND & STORY",
      author: "Renata Joffre",
      date: "2025年11月13日",
      imageIndex: 2,
    },
    {
      title: ["「ブルースのステージを再現するために", "限界に挑んだ」──ジェレミー・アレン・", "ホワイトの覚悟【FAB FIVE】"],
      category: "LIFESTYLE / CULTURE & LIFE",
      author: "HIROAKI SAITO、YAKA MATSUMOTO",
      date: "2025年11月13日",
      imageIndex: 3,
    },
    {
      title: ["心と体を整えるヨガとピラティスで", "理想のライフスタイルを手に入れる"],
      category: "YOGA / WELLNESS",
      author: "YUKI TANAKA、HARUKA SATO",
      date: "2025年11月12日",
      imageIndex: 4,
    },
  ];

  return (
    <div className="absolute h-[1244.03px] left-[40px] right-[40px] top-[24px]">
      {/* セクション タイトル */}
      <div className="absolute h-[50px] left-[64px] right-[64px] top-0">
        <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[1px_0px] border-solid inset-0 pointer-events-none" />
        <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Medium',sans-serif] h-[24px] justify-center leading-[0] left-0 not-italic text-[21px] text-black top-[25px] tracking-[2.1px] translate-y-[-50%] uppercase w-[160px]">
          <p className="leading-[24px]">TOP STORIES</p>
        </div>
      </div>

      {/* メイン記事（中央・大きい） */}
      <div className="absolute h-[1130.34px] left-[440px] right-[440px] top-[93.69px]">
        <div className="absolute h-[960px] left-0 top-0 w-[720px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <ImageWithFallback 
              alt="Wellness and fitness" 
              className="absolute left-0 max-w-none size-full top-0 object-cover" 
              src={getImage(mainArticle.imageIndex)} 
            />
          </div>
        </div>
        
        <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-1/2 not-italic text-[12px] text-black text-center top-[983.98px] tracking-[1.8px] translate-x-[-50%] translate-y-[-50%] uppercase w-[720px]">
          <p className="leading-[16px] whitespace-nowrap">{mainArticle.category}</p>
        </div>

        <div className="absolute h-[80px] left-0 right-0 top-[999.98px]">
          <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[86px] justify-center leading-[42px] left-1/2 text-[33px] text-black text-center top-[40px] translate-x-[-50%] translate-y-[-50%] w-[720px]">
            {mainArticle.title.map((line, idx) => (
              <p key={idx} className={idx < mainArticle.title.length - 1 ? "mb-0" : ""}>{line}</p>
            ))}
          </div>
        </div>

        <div className="absolute h-[16.36px] left-0 right-0 top-[1095.98px]">
          <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-1/2 not-italic text-[12px] text-black text-center top-[8px] tracking-[1.964px] translate-x-[-50%] translate-y-[-50%] uppercase w-[720px]">
            <p className="leading-[16.36px]">By {mainArticle.author}</p>
          </div>
        </div>

        <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-1/2 text-[12px] text-black text-center top-[1123.34px] tracking-[-0.1px] translate-x-[-50%] translate-y-[-50%] w-[720px]">
          <p className="leading-[14px] whitespace-nowrap">{mainArticle.date}</p>
        </div>
      </div>

      {/* 左上の記事 */}
      <ArticleCard article={subArticles[0]} position="left-[64px] right-[1192px] top-[93.69px]" />

      {/* 左下の記事 */}
      <ArticleCard article={subArticles[1]} position="left-[64px] right-[1192px] top-[685.86px]" />

      {/* 右上の記事 */}
      <ArticleCard article={subArticles[2]} position="left-[1192px] right-[64px] top-[93.69px]" />

      {/* 右下の記事 */}
      <ArticleCard article={subArticles[3]} position="left-[1192px] right-[64px] top-[685.86px]" />
    </div>
  );
}

interface ArticleCardProps {
  article: Article;
  position: string;
}

function ArticleCard({ article, position }: ArticleCardProps) {
  const hasThreeLines = article.title.length === 3;
  const cardHeight = hasThreeLines ? "h-[560.17px]" : "h-[538.17px]";

  return (
    <div className={`absolute ${cardHeight} ${position}`}>
      {/* 画像 */}
      <div className="absolute left-0 size-[344px] top-0">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ImageWithFallback 
            alt="Fitness lifestyle" 
            className="absolute left-0 max-w-none size-full top-0 object-cover" 
            src={getImage(article.imageIndex)} 
          />
        </div>
      </div>

      {/* カテゴリ */}
      <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-1/2 not-italic text-[11.8px] text-black text-center top-[368px] tracking-[1.8px] translate-x-[-50%] translate-y-[-50%] uppercase w-[344px]">
        <p className="leading-[16px] whitespace-nowrap">{article.category}</p>
      </div>

      {/* タイトル */}
      <div className={`absolute ${hasThreeLines ? 'h-[66px]' : 'h-[44px]'} left-0 right-0 top-[384px]`}>
        <div className={`absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium ${hasThreeLines ? 'h-[70px]' : 'h-[48px]'} justify-center leading-[22px] left-1/2 text-[18px] text-black text-center ${hasThreeLines ? 'top-[33px]' : 'top-[22px]'} tracking-[0.675px] translate-x-[-50%] translate-y-[-50%] w-[344px]`}>
          {article.title.map((line, idx) => (
            <p key={idx} className={idx < article.title.length - 1 ? "mb-0" : ""}>{line}</p>
          ))}
        </div>
      </div>

      {/* 著者 */}
      <div className={`absolute h-[16.36px] left-0 right-0 ${hasThreeLines ? 'top-[466px]' : 'top-[444px]'}`}>
        <div className="absolute flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] left-1/2 not-italic text-[12px] text-black text-center top-[8px] tracking-[1.964px] translate-x-[-50%] translate-y-[-50%] uppercase w-[344px]">
          <p className="leading-[16.36px]">By {article.author}</p>
        </div>
      </div>

      {/* 日付 */}
      <div className="absolute flex flex-col font-['Noto_Sans_JP:Medium',sans-serif] font-medium h-[14px] justify-center leading-[0] left-1/2 text-[12px] text-black text-center top-[${hasThreeLines ? '493.36px' : '471.36px'}] tracking-[-0.1px] translate-x-[-50%] translate-y-[-50%] w-[344px]">
        <p className="leading-[14px] whitespace-nowrap">{article.date}</p>
      </div>
    </div>
  );
}