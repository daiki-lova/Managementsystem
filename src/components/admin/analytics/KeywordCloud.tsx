import React from 'react';
import { Search, Hash } from 'lucide-react';

export function KeywordCloud() {
  const keywords = [
    { text: "ブログ 運用", volume: "high", score: 88 },
    { text: "SEO 対策", volume: "high", score: 76 },
    { text: "AI ライティング", volume: "medium", score: 92 },
    { text: "記事作成 ツール", volume: "medium", score: 65 },
    { text: "初心者", volume: "low", score: 45 },
    { text: "継続", volume: "low", score: 55 },
    { text: "収益化", volume: "high", score: 82 },
  ];

  return (
    <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 text-white mb-6">
        <Search className="text-neutral-400" size={20} />
        <h3 className="font-bold">流入キーワード分析</h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {keywords.map((kw, i) => (
          <div 
            key={i}
            className="relative group cursor-default"
          >
            <div className={`
                px-4 py-2 rounded-full border text-sm font-medium transition-all
                ${kw.score > 80 
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                }
            `}>
                <span className="mr-2 opacity-50">#</span>
                {kw.text}
                <span className="ml-2 text-xs opacity-60 scale-75 inline-block">
                    Vol: {kw.volume}
                </span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                CTR貢献度: {kw.score}点
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
