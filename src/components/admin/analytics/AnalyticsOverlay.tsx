import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { ScoreCard } from './ScoreCard';
import { AiSuggestions } from './AiSuggestions';
import { KeywordCloud } from './KeywordCloud';

interface AnalyticsOverlayProps {
  onClose: () => void;
  onApplySuggestion: (newTitle: string) => void;
}

export function AnalyticsOverlay({ onClose, onApplySuggestion }: AnalyticsOverlayProps) {
  return (
    <div className="w-full h-full overflow-y-auto pb-20 px-6 pointer-events-auto">
      <div className="max-w-5xl mx-auto">
        
        {/* Header of Overlay */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white mb-2"
            >
              記事分析レポート
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-400"
            >
              AIがコンテンツ品質とSEOパフォーマンスを診断しました
            </motion.p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Score & Keywords */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
            >
                <ScoreCard />
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
            >
                <KeywordCloud />
            </motion.div>
          </div>

          {/* Right Column: AI Suggestions */}
          <div className="lg:col-span-1">
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.4 }}
               className="sticky top-24"
            >
                <AiSuggestions onApply={onApplySuggestion} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
