import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Pen, BarChart2, CheckCircle2, Cloud, Clock, Eye, Image as ImageIcon, Send, ChevronDown, Calendar as CalendarIcon, Ban, RefreshCw, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import type { AppMode } from '../types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";

interface GlobalHeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  status: 'draft' | 'saving' | 'saved';
  articleStatus?: 'draft' | 'review' | 'published' | 'scheduled';
  onBack: () => void;
  onPreview: () => void;
  onPublish?: () => void;
  onSchedule?: () => void;
  onSaveDraft?: () => void;
  onUnpublish?: () => void;
  title?: string;
  thumbnail?: string;
}

export function GlobalHeader({ 
    mode, 
    setMode, 
    status, 
    articleStatus = 'draft', 
    onBack, 
    onPreview, 
    onPublish, 
    onSchedule, 
    onSaveDraft,
    onUnpublish, 
    title, 
    thumbnail 
}: GlobalHeaderProps) {
  
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
                <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    articleStatus === 'published' ? "text-emerald-600" :
                    articleStatus === 'scheduled' ? "text-orange-600" :
                    "text-neutral-400"
                )}>
                    {articleStatus === 'published' ? 'Published' : 
                     articleStatus === 'scheduled' ? 'Scheduled' : 'Draft'}
                </span>
                <span className="text-sm font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[300px]" title={title}>
                    {title || '無題の記事'}
                </span>
            </div>
        </div>
      </div>

      {/* Center: Spacer */}
      <div className="flex-1 flex justify-center">
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

        {articleStatus === 'published' ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button 
                      className="bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-neutral-900/10 flex items-center gap-2"
                    >
                      <RefreshCw size={14} className="-ml-1" />
                      更新する
                      <ChevronDown size={14} className="ml-1 opacity-70" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onPublish} className="cursor-pointer">
                        <RefreshCw size={14} className="mr-2" />
                        記事を更新
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onUnpublish} className="text-red-600 cursor-pointer focus:text-red-600">
                        <Ban size={14} className="mr-2" />
                        非公開にする
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) : articleStatus === 'scheduled' ? (
            <button 
                onClick={onSchedule}
                className="bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-orange-500/20"
            >
                <CalendarIcon size={14} />
                予約を変更
            </button>
        ) : (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button 
                      className="bg-neutral-900 text-white hover:bg-neutral-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-neutral-900/10 flex items-center gap-2"
                    >
                      <Send size={14} className="-ml-1" />
                      公開する
                      <ChevronDown size={14} className="ml-1 opacity-70" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onPublish} className="cursor-pointer">
                        <Send size={14} className="mr-2" />
                        今すぐ公開
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSchedule} className="cursor-pointer">
                        <CalendarIcon size={14} className="mr-2" />
                        予約公開...
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSaveDraft} className="cursor-pointer">
                        <FileText size={14} className="mr-2" />
                        下書きとして保存
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
