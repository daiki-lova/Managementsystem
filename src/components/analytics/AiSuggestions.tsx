import React, { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiSuggestionsProps {
  onApply: (newTitle: string) => void;
}

export function AiSuggestions({ onApply }: AiSuggestionsProps) {
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const suggestions = [
    {
      id: '1',
      type: 'critical',
      title: 'タイトルのCTRが低迷予測',
      description: '現在のタイトルは検索結果で埋もれる可能性があります。具体的な数字を入れて興味を引きましょう。',
      current: 'ブログ運用は継続が大事',
      proposal: '【継続率3倍】ブログ運用は「直感×分析」で勝つ',
      impact: 'CTR +2.5% 予測'
    },
    {
      id: '2',
      type: 'warning',
      title: '導入文の離脱リスク',
      description: '冒頭の3行で結論が述べられていません。ユーザーが答えを探して離脱する可能性があります。',
      proposal: 'リード文に「結論：ツール選びが9割」を追加',
      impact: '滞在時間 +30秒'
    }
  ];

  const handleApply = (id: string, proposal: string) => {
    setAppliedId(id);
    // Simulate API call / processing
    setTimeout(() => {
        if (id === '1') {
            onApply(proposal);
        }
    }, 500);
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2 text-white mb-2">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="font-bold">AI改善提案</h3>
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30">3件</span>
        </div>

        {suggestions.map((suggestion) => (
            <div 
                key={suggestion.id} 
                className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-xl p-5 text-sm text-neutral-300 shadow-lg hover:border-neutral-700 transition-colors"
            >
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        suggestion.type === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                        {suggestion.type === 'critical' ? 'Critical' : 'Improvement'}
                    </span>
                    <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                        <TrendingUpIcon /> {suggestion.impact}
                    </span>
                </div>

                <h4 className="text-white font-bold mb-2">{suggestion.title}</h4>
                <p className="mb-4 text-neutral-400 leading-relaxed">
                    {suggestion.description}
                </p>

                <div className="bg-black/50 rounded-lg p-3 mb-4 space-y-2 border border-neutral-800">
                    <div className="flex items-center gap-2 text-red-400/70 line-through text-xs">
                        <span className="w-1 h-1 bg-red-500 rounded-full" />
                        {suggestion.current}
                    </div>
                    <div className="flex items-center gap-2 text-green-400 font-medium">
                        <ArrowRight size={12} />
                        {suggestion.proposal}
                    </div>
                </div>

                <button
                    onClick={() => handleApply(suggestion.id, suggestion.proposal)}
                    disabled={appliedId === suggestion.id}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {appliedId === suggestion.id ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            AI書き換え中...
                        </>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            AI案を採用する
                        </>
                    )}
                </button>
            </div>
        ))}
    </div>
  );
}

function TrendingUpIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    )
}
