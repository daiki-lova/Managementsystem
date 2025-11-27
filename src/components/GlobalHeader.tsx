import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Pen, BarChart2, CheckCircle2, Cloud, Clock, Eye, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AppMode } from '../types';

interface GlobalHeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  status: 'draft' | 'saving' | 'saved';
  onBack: () => void;
  onPreview: () => void;
  title?: string;
  thumbnail?: string;
}

export function GlobalHeader({ mode, setMode, status, onBack, onPreview, title, thumbnail }: GlobalHeaderProps) {
  return (
    <header className="w-full h-16 bg-white/90 backdrop-blur-md z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between px-6 transition-colors duration-300 relative">
      
      {/* Left: Back Button & Article Info */}
      <div className="flex items-center gap-4 w-1/3">
        <button 
            onClick={onBack}
            className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
        >
            <ChevronLeft size={20} />
        </button>
        
        {/* Article Metadata Display */}
        <div className="flex items-center gap-3 overflow-hidden pl-2">
            <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Draft</span>
                <span className="text-sm font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[300px]" title={title}>
                    {title || '無題の記事'}
                </span>
            </div>
        </div>
      </div>

      {/* Center: Spacer (Mode Toggle Removed) */}
      <div className="flex-1 flex justify-center">
         {/* Mode Toggle Removed */}
      </div>

      {/* Right: Status & Actions */}
      <div className="w-1/3 flex justify-end items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          {status === 'saving' ? (
             <>
               <Cloud size={14} className="animate-pulse" />
               <span>保存中...</span>
             </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>保存済み</span>
              <span className="text-neutral-300">•</span>
              <span className="tabular-nums">12:45</span>
            </>
          )}
        </div>
        
        <button 
          onClick={onPreview}
          className="text-neutral-600 hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-neutral-100 flex items-center gap-2"
        >
          <Eye size={18} />
          <span className="hidden sm:inline">プレビュー</span>
        </button>

        <button className="bg-black text-white hover:bg-neutral-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-neutral-200">
          公開する
        </button>
      </div>
    </header>
  );
}
