"use client";

import { useEffect, useState, useRef } from "react";
import SidebarMenu from "./SidebarMenu";
import FixedHeader from "./FixedHeader";
import { Footer } from "./imports/Container";
import { ImageWithFallback } from "./ImageWithFallback";

interface ArticlePageProps {
  onNavigate: (page: string, category?: string) => void;
}

export default function ArticlePage({ onNavigate }: ArticlePageProps) {
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(1680);
  const [menuOpen, setMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const designWidth = 1680;

  useEffect(() => {
    window.scrollTo(0, 0);
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
  }, [scale]);

  // 関連記事データ
  const relatedArticles = [
    {
      title: "ピラティスで体幹を強化！美しい姿勢とスタイルを手に入れる",
      category: "PILATES",
      image: "https://images.unsplash.com/photo-1715780463401-b9ef0567943e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwZXhlcmNpc2V8ZW58MXx8fHwxNzYzNDU1ODI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "朝ヨガで1日を健やかにスタート──初心者でもできる5分ルーティン",
      category: "YOGA",
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwbWVkaXRhdGlvbnxlbnwxfHx8fDE3NjM0NzIyNDV8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "マインドフルネス瞑想で心の健康を整える──ストレス解消のテクニック",
      category: "WELLNESS",
      image: "https://images.unsplash.com/photo-1603983616619-faf118d6c374?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpdGF0aW9uJTIwcHJhY3RpY2V8ZW58MXx8fHwxNzYzNTE1MDc3fDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "フィットネスで理想のボディラインを作る──女性のための筋トレガイド",
      category: "FITNESS",
      image: "https://images.unsplash.com/photo-1573858129683-59f4d9c445d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGZpdG5lc3MlMjB0cmFpbmluZ3xlbnwxfHx8fDE3NjM1MDkyNTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "栄養バランスを整える食事法──美しさを引き出すヘルシーレシピ",
      category: "DIET",
      image: "https://images.unsplash.com/photo-1670164747721-d3500ef757a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMG51dHJpdGlvbnxlbnwxfHx8fDE3NjM0MzMyOTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "ランニングで心身をリフレッシュ──効果的な走り方のコツ",
      category: "SPORTS",
      image: "https://images.unsplash.com/photo-1645238426817-8c3e7d1396cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHJ1bm5pbmclMjBleGVyY2lzZXxlbnwxfHx8fDE3NjM0NjU3Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "柔軟性を高めるストレッチ習慣──しなやかな体を手に入れる",
      category: "YOGA",
      image: "https://images.unsplash.com/photo-1599447421376-611783057464?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3RyZXRjaGluZyUyMHBvc2V8ZW58MXx8fHwxNjM1MTU1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "ウェルネスライフのすすめ──自分らしく健やかに生きるヒント",
      category: "LIFE",
      image: "https://images.unsplash.com/photo-1548966268-b978ed7b2e83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdlbGxuZXNzJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2MzQ4NjczOXww&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

  return (
    <div className="w-full bg-white overflow-x-hidden">
      <SidebarMenu onNavigate={onNavigate} scale={scale} isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <FixedHeader scale={scale} onNavigate={onNavigate} onToggleMenu={() => setMenuOpen(!menuOpen)} />
      
      {/* デスクトップ・タブレット版（768px以上） */}
      <div
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
          
          {/* 記事コンテンツ */}
          <div className="px-[104px] py-[60px]">
            {/* カテゴリータグ */}
            <div className="text-center mb-[24px]">
              <div className="flex flex-col font-['Noto_Sans_CJK_JP:Bold',sans-serif] h-[12px] justify-center leading-[0] not-italic text-[12px] text-black tracking-[1.8px] uppercase inline-block">
                <p className="leading-[12px]">YOGA / WELLNESS</p>
              </div>
            </div>

            {/* タイトル */}
            <h1 className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold leading-[49px] text-[35px] text-black text-center tracking-[0.808px] mb-[40px] max-w-[1074px] mx-auto">
              心と体を整える──ヨガとピラティスで理想のライフスタイルを手に入れる
            </h1>

            {/* リード文 */}
            <div className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[18px] text-center tracking-[0.48px] mb-[40px] max-w-[1050px] mx-auto">
              <p className="mb-0">健康的で美しいライフスタイルを求める女性たちの間で、ヨガとピラティスの人気が高まっています。</p>
              <p>心身のバランスを整え、しなやかで強い体を手に入れるための実践的なガイドをお届けします。</p>
            </div>

            {/* 著者・日付情報 */}
            <div className="text-center mb-[60px]">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[12px] tracking-[1.964px] uppercase">By</span>
                <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[12px] tracking-[1.964px] uppercase">YUKI TANAKA</span>
              </div>
              <div className="font-['Noto_Sans_JP:Medium',sans-serif] font-medium text-[#1f1f1f] text-[12px] tracking-[-0.1px]">
                2025年11月18日
              </div>
            </div>

            {/* メインコンテンツエリア */}
            <div className="max-w-[1280px] mx-auto">
              <div className="flex gap-[60px] justify-center">
                {/* 左側：記事本文 */}
                <div className="flex-1 max-w-[760px]">
                  {/* メイン画像 */}
                  <div className="mb-[40px]">
                    <ImageWithFallback 
                      alt="Woman practicing yoga" 
                      className="w-full h-auto object-cover" 
                      src="https://images.unsplash.com/photo-1610562269919-86791081ad29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBwb3NlfGVufDF8fHx8MTc2MzUxNTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080" 
                    />
                    <p className="font-['Noto_Sans_JP:DemiLight',sans-serif] font-[350] leading-[20.8px] text-[13px] text-black tracking-[0.16px] mt-3">
                      ヨガは心と体のバランスを整える古代からの実践法
                    </p>
                  </div>

                  {/* 記事本文 */}
                  <div className="space-y-[32px]">
                    <div>
                      <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold text-[24px] text-black tracking-[0.2px] mb-[16px]">
                        ヨガがもたらす心身への効果
                      </h2>
                      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[16px] tracking-[0.4px]">
                        ヨガは単なるエクササイズではなく、呼吸法、ポーズ、瞑想を組み合わせた総合的な心身のケア方法です。定期的なヨガの実践により、柔軟性が向上し、筋力が強化され、姿勢が改善されます。また、ストレス軽減や集中力向上といった精神面での効果も期待できます。
                        </p>
                    </div>

                    {/* サブ画像1 */}
                    <div>
                      <ImageWithFallback 
                        alt="Pilates studio" 
                        className="w-full h-auto object-cover" 
                        src="https://images.unsplash.com/photo-1604467731651-3d8b9c702b86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwc3R1ZGlvfGVufDF8fHx8MTc2MzQwMzMwMHww&ixlib=rb-4.1.0&q=80&w=1080" 
                      />
                      <p className="font-['Noto_Sans_JP:DemiLight',sans-serif] font-[350] leading-[20.8px] text-[13px] text-black tracking-[0.16px] mt-3">
                        ピラティスは体幹強化に効果的なエクササイズ
                      </p>
                    </div>

                    <div>
                      <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold text-[24px] text-black tracking-[0.2px] mb-[16px]">
                        ピラティスで体幹を鍛える
                      </h2>
                      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-[16px]">
                        ピラティスは、体幹（コア）の筋肉を重点的に鍛えるエクササイズです。深層筋を強化することで、美しい姿勢を保ち、日常生活での動作が楽になります。また、リハビリテーションとしても活用されており、体に負担をかけずに効果的なトレーニングが可能です。
                        </p>
                      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[16px] tracking-[0.4px]">
                        ヨガとピラティスを組み合わせることで、より総合的な効果が期待できます。週に2〜3回、各30分程度の実践から始めることをおすすめします。
                        </p>
                    </div>

                    <div>
                      <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] font-bold text-[24px] text-black tracking-[0.2px] mb-[16px]">
                        初心者におすすめのスタート方法
                      </h2>
                      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[16px] tracking-[0.4px] mb-[16px]">
                        これからヨガやピラティスを始める方は、まずは専門のインストラクターから基本を学ぶことをおすすめします。正しいフォームと呼吸法を身につけることで、怪我を防ぎ、効果を最大限に引き出すことができます。
                        </p>
                      <ul className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[28.8px] text-[#1f1f1f] text-[16px] tracking-[0.4px] list-disc pl-6 space-y-2">
                        <li>週2〜3回、20〜30分の練習から始める</li>
                        <li>無理をせず、自分のペースで進める</li>
                        <li>呼吸を意識し、リラックスした状態で行う</li>
                        <li>継続することが最も重要</li>
                      </ul>
                    </div>
                  </div>

                  {/* タグセクション（横スクロール） */}
                  <div className="mt-[60px] pt-[40px] border-t border-[#e0e0e0]">
                    <div className="mb-[16px]">
                      <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[14px] tracking-[1.4px] uppercase">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['ヨガ', 'ピラティス', 'ウェルネス', '体幹トレーニング', '健康', 'ライフスタイル', 'フィットネス', 'マインドフルネス'].map((tag, index) => (
                        <button
                          key={index}
                          className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors whitespace-nowrap font-['Noto_Sans_JP:Medium',sans-serif] text-[13px]"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 内部リンク（関連記事） */}
                  <div className="mt-[60px]">
                    <h3 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[20px] tracking-[1.4px] uppercase mb-[32px]">
                      Related Articles
                    </h3>
                    <div className="grid grid-cols-4 gap-[24px] max-md:grid-cols-2">
                      {relatedArticles.map((article, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className="aspect-square overflow-hidden bg-gray-100 mb-3">
                            <ImageWithFallback 
                              alt={article.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              src={article.image} 
                            />
                          </div>
                          <div className="mb-2">
                            <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[10px] tracking-[1.6px] uppercase">
                              {article.category}
                            </span>
                          </div>
                          <h4 className="font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[20px] text-[14px] text-black tracking-[-0.2px] group-hover:underline">
                            {article.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右側：サイドバー */}
                <div className="w-[320px] flex-shrink-0">
                  {/* 著者プロフィール（EAT対応） */}
                  <div className="border border-[#e0e0e0] p-[24px] mb-[32px]">
                    <div className="text-center mb-[20px]">
                      <div className="w-[100px] h-[100px] rounded-full overflow-hidden mx-auto mb-[16px]">
                        <ImageWithFallback 
                          alt="Author profile" 
                          className="w-full h-full object-cover" 
                          src="https://images.unsplash.com/photo-1667890785988-8da12fd0989b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBpbnN0cnVjdG9yfGVufDF8fHx8MTc2MzQ0Nzc2N3ww&ixlib=rb-4.1.0&q=80&w=1080" 
                        />
                      </div>
                      <h3 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[16px] tracking-[1.4px] uppercase mb-[8px]">
                        YUKI TANAKA
                      </h3>
                      <p className="font-['Noto_Sans_JP:Medium',sans-serif] text-[12px] text-[#333] tracking-[0.2px]">
                        ヨガ・ピラティスインストラクター
                      </p>
                    </div>
                    
                    <div className="mb-[20px]">
                      <h4 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[13px] tracking-[1.2px] uppercase mb-[12px]">
                        Profile
                      </h4>
                      <p className="font-['Noto_Sans_JP:Light',sans-serif] font-light leading-[20px] text-[13px] text-[#1f1f1f] tracking-[0.2px]">
                        都内でヨガ・ピラティススタジオ「ALIGN STUDIO」を主宰。全米ヨガアライアンス認定RYT500を取得後、延べ5,000名以上の生徒を指導。初心者から上級者まで、一人ひとりの体質や目標に合わせたパーソナルアプローチで、心身の健康をサポート。マインドフルネスと機能解剖学を融合させた独自のメソッドで、多くの女性から支持を得ている。
                      </p>
                    </div>

                    <div>
                      <h4 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[13px] tracking-[1.2px] uppercase mb-[12px]">
                        Certifications
                      </h4>
                      <ul className="space-y-2">
                        <li className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[12px] text-[#1f1f1f] tracking-[0.2px] flex items-start">
                          <span className="mr-2">•</span>
                          <span>全米ヨガアライアンス RYT500</span>
                        </li>
                        <li className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[12px] text-[#1f1f1f] tracking-[0.2px] flex items-start">
                          <span className="mr-2">•</span>
                          <span>BASI Pilates 認定インストラクター</span>
                        </li>
                        <li className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[12px] text-[#1f1f1f] tracking-[0.2px] flex items-start">
                          <span className="mr-2">•</span>
                          <span>IHTA認定 ヨガインストラクター1級</span>
                        </li>
                        <li className="font-['Noto_Sans_JP:Light',sans-serif] font-light text-[12px] text-[#1f1f1f] tracking-[0.2px] flex items-start">
                          <span className="mr-2">•</span>
                          <span>健康運動指導士</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 人気記事 */}
                  <div className="border border-[#e0e0e0] p-[24px]">
                    <h4 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[14px] tracking-[1.4px] uppercase mb-[24px]">
                      Popular Articles
                    </h4>
                    <div className="space-y-[24px]">
                      {relatedArticles.slice(0, 5).map((article, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className="aspect-[16/9] overflow-hidden bg-gray-100 mb-2">
                            <ImageWithFallback 
                              alt={article.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              src={article.image} 
                            />
                          </div>
                          <div className="mb-1">
                            <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[9px] tracking-[1.4px] uppercase">
                              {article.category}
                            </span>
                          </div>
                          <h5 className="font-['Noto_Sans_JP:Medium',sans-serif] font-medium leading-[18px] text-[13px] text-black tracking-[-0.2px] group-hover:underline">
                            {article.title}
                          </h5>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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
        
        {/* 記事コンテンツ */}
        <div className="px-5 py-8">
          {/* カテゴリータグ */}
          <div className="text-center mb-4">
            <p className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[10px] tracking-[1.5px] uppercase">
              YOGA / WELLNESS
            </p>
          </div>

          {/* タイトル */}
          <h1 className="font-['Noto_Sans_JP:Medium',sans-serif] leading-[1.4] text-center mb-6">
            心と体を整える──ヨガとピラティスで理想のライフスタイルを手に入れる
          </h1>

          {/* 著者・日付情報 */}
          <div className="text-center mb-8 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[10px] tracking-[1.4px] uppercase">By</span>
              <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[10px] tracking-[1.4px] uppercase">YUKI TANAKA</span>
            </div>
            <p className="font-['Noto_Sans_JP:Medium',sans-serif] text-[11px] text-[#333]">
              2025年11月18日
            </p>
          </div>

          {/* メイン画像 */}
          <div className="mb-6">
            <ImageWithFallback 
              alt="Woman practicing yoga" 
              className="w-full h-auto object-cover" 
              src="https://images.unsplash.com/photo-1610562269919-86791081ad29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBwb3NlfGVufDF8fHx8MTc2MzUxNTA3N3ww&ixlib=rb-4.1.0&q=80&w=1080" 
            />
            <p className="font-['Noto_Sans_JP:DemiLight',sans-serif] text-[12px] text-[#333] mt-2">
              ヨガは心と体のバランスを整える古代からの実践法
            </p>
          </div>

          {/* リード文 */}
          <div className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f] mb-6 space-y-2">
            <p>健康的で美しいライフスタイルを求める女性たちの間で、ヨガとピラティスの人気が高まっています。</p>
            <p>心身のバランスを整え、しなやかで強い体を手に入れるための実践的なガイドをお届けします。</p>
          </div>

          {/* 記事本文 */}
          <div className="space-y-6">
            <div>
              <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] mb-3">
                ヨガがもたらす心身への効果
              </h2>
              <p className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f]">
                ヨガは単なるエクササイズではなく、呼吸法、ポーズ、瞑想を組み合わせた総合的な心身のケア方法です。定期的なヨガの実践により、柔軟性が向上し、筋力が強化され、姿勢が改善されます。また、ストレス軽減や集中力向上といった精神面での効果も期待できます。
              </p>
            </div>

            {/* サブ画像1 */}
            <div>
              <ImageWithFallback 
                alt="Pilates studio" 
                className="w-full h-auto object-cover" 
                src="https://images.unsplash.com/photo-1604467731651-3d8b9c702b86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWxhdGVzJTIwc3R1ZGlvfGVufDF8fHx8MTc2MzQwMzMwMHww&ixlib=rb-4.1.0&q=80&w=1080" 
              />
              <p className="font-['Noto_Sans_JP:DemiLight',sans-serif] text-[12px] text-[#333] mt-2">
                ピラティスは体幹強化に効果的なエクササイズ
              </p>
            </div>

            <div>
              <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] mb-3">
                ピラティスで体幹を鍛える
              </h2>
              <p className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f] mb-3">
                ピラティスは、体幹（コア）の筋肉を重点的に鍛えるエクササイズです。深層筋を強化することで、美しい姿勢を保ち、日常生活での動作が楽になります。また、リハビリテーションとしても活用されており、体に負担をかけずに効果的なトレーニングが可能です。
              </p>
              <p className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f]">
                ヨガとピラティスを組み合わせることで、より総合的な効果が期待できます。週に2〜3回、各30分程度の実践から始めることをおすすめします。
              </p>
            </div>

            <div>
              <h2 className="font-['Noto_Sans_JP:Bold',sans-serif] mb-3">
                初心者におすすめのスタート方法
              </h2>
              <p className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f] mb-3">
                これからヨガやピラティスを始める方は、まずは専門のインストラクターから基本を学ぶことをおすすめします。正しいフォームと呼吸法を身につけることで、怪我を防ぎ、効果を最大限に引き出すことができます。
              </p>
              <ul className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.7] text-[#1f1f1f] list-disc pl-5 space-y-1">
                <li>週2〜3回、20〜30分の練習から始める</li>
                <li>無理をせず、自分のペースで進める</li>
                <li>呼吸を意識し、リラックスした状態で行う</li>
                <li>継続することが最も重要</li>
              </ul>
            </div>
          </div>

          {/* タグセクション */}
          <div className="mt-10 pt-6 border-t border-[#e0e0e0]">
            <div className="mb-3">
              <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[12px] tracking-[1.2px] uppercase">Tags</span>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                {['ヨガ', 'ピラティス', 'ウェルネス', '体幹トレーニング', '健康', 'ライフスタイル', 'フィットネス', 'マインドフルネス'].map((tag, index) => (
                  <button
                    key={index}
                    className="px-3 py-2 border border-black hover:bg-black hover:text-white transition-colors whitespace-nowrap font-['Noto_Sans_JP:Medium',sans-serif] text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 著者プロフィール */}
          <div className="border border-[#e0e0e0] p-5 mt-8">
            <div className="text-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3">
                <ImageWithFallback 
                  alt="Author profile" 
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1667890785988-8da12fd0989b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHlvZ2ElMjBpbnN0cnVjdG9yfGVufDF8fHx8MTc2MzQ0Nzc2N3ww&ixlib=rb-4.1.0&q=80&w=1080" 
                />
              </div>
              <h3 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] tracking-[1.2px] uppercase mb-1">
                YUKI TANAKA
              </h3>
              <p className="font-['Noto_Sans_JP:Medium',sans-serif] text-[11px] text-[#333]">
                ヨガ・ピラティスインストラクター
              </p>
            </div>
            
            <div className="mb-4">
              <h4 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[11px] tracking-[1.2px] uppercase mb-2">
                Profile
              </h4>
              <p className="font-['Noto_Sans_JP:Light',sans-serif] leading-[1.6] text-[12px] text-[#1f1f1f]">
                都内でヨガ・ピラティススタジオ「ALIGN STUDIO」を主宰。全米ヨガアライアンス認定RYT500を取得後、延べ5,000名以上の生徒を指導。初心者から上級者まで、一人ひとりの体質や目標に合わせたパーソナルアプローチで、心身の健康をサポート。
              </p>
            </div>

            <div>
              <h4 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[11px] tracking-[1.2px] uppercase mb-2">
                Certifications
              </h4>
              <ul className="space-y-1">
                <li className="font-['Noto_Sans_JP:Light',sans-serif] text-[11px] text-[#1f1f1f] flex items-start">
                  <span className="mr-2">•</span>
                  <span>全米ヨガアライアンス RYT500</span>
                </li>
                <li className="font-['Noto_Sans_JP:Light',sans-serif] text-[11px] text-[#1f1f1f] flex items-start">
                  <span className="mr-2">•</span>
                  <span>BASI Pilates 認定インストラクター</span>
                </li>
                <li className="font-['Noto_Sans_JP:Light',sans-serif] text-[11px] text-[#1f1f1f] flex items-start">
                  <span className="mr-2">•</span>
                  <span>IHTA認定 ヨガインストラクター1級</span>
                </li>
                <li className="font-['Noto_Sans_JP:Light',sans-serif] text-[11px] text-[#1f1f1f] flex items-start">
                  <span className="mr-2">•</span>
                  <span>健康運動指導士</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 関連記事 */}
          <div className="mt-10">
            <h3 className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] tracking-[1.4px] uppercase mb-5">
              Related Articles
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {relatedArticles.slice(0, 4).map((article, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="aspect-square overflow-hidden bg-gray-100 mb-2">
                    <ImageWithFallback 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      src={article.image} 
                    />
                  </div>
                  <div className="mb-1">
                    <span className="font-['Noto_Sans_CJK_JP:Bold',sans-serif] text-[9px] tracking-[1.4px] uppercase">
                      {article.category}
                    </span>
                  </div>
                  <h4 className="font-['Noto_Sans_JP:Medium',sans-serif] leading-[1.4] text-[12px] text-black group-hover:underline line-clamp-2">
                    {article.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-16">
          <Footer />
        </div>
      </div>
    </div>
  );
}