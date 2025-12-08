'use client'

import React, { useEffect, useState } from 'react';
import { X, Calendar, User, Share2, MessageCircle, Heart } from 'lucide-react';
import { BlockData } from '../../types';
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ArticlePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  blocks: BlockData[];
  thumbnail?: string;
  category: string;
  tags: string[];
  authorName?: string;
  publishedAt?: Date;
}

export function ArticlePreview({
  isOpen,
  onClose,
  title,
  blocks,
  thumbnail,
  category,
  tags,
  authorName = "AI Blogger",
  publishedAt = new Date(),
}: ArticlePreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] h-[90vh] w-full p-0 overflow-hidden bg-white rounded-xl shadow-2xl border-none flex flex-col">
        <DialogTitle className="sr-only">Article Preview</DialogTitle>
        <DialogDescription className="sr-only">
          Preview of the article content as it would appear on the live site.
        </DialogDescription>
        
        {/* Preview Header (Browser-like toolbar) */}
        <div className="h-12 bg-neutral-100 border-b border-neutral-200 flex items-center px-4 justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="ml-4 flex items-center gap-2 bg-white py-1 px-3 rounded text-xs text-neutral-400 border border-neutral-200 min-w-[300px]">
                    <span className="text-neutral-300">https://</span>
                    <span className="text-neutral-800">makeblog.ai/preview/article/draft-123</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Desktop Preview</span>
                <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-500 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 bg-white">
            <div className="max-w-4xl mx-auto bg-white min-h-full shadow-sm pb-20">
                
                {/* Hero Section */}
                <div className="px-8 pt-12 pb-8 md:px-12 md:pt-16">
                    {category && (
                        <span className="inline-block px-3 py-1 mb-6 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
                            {category}
                        </span>
                    )}
                    
                    <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 leading-tight mb-6">
                        {title || "無題の記事"}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                                <User size={16} />
                            </div>
                            <span className="font-medium text-neutral-900">{authorName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <time>{format(publishedAt, 'yyyy年M月d日', { locale: ja })}</time>
                        </div>
                    </div>

                    {thumbnail && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg mb-12">
                            <img 
                                src={thumbnail} 
                                alt={title} 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Article Body */}
                <div className="px-8 md:px-12 max-w-3xl mx-auto">
                    <div className="prose prose-lg prose-neutral max-w-none">
                        {blocks.map((block) => (
                            <BlockRenderer key={block.id} block={block} />
                        ))}
                        {blocks.length === 0 && (
                            <p className="text-neutral-300 italic text-center py-10">本文はまだありません</p>
                        )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-neutral-100">
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded text-sm hover:bg-neutral-200 transition-colors cursor-pointer">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Engagement Mock */}
                    <div className="mt-12 flex items-center justify-between py-6 border-y border-neutral-100">
                         <div className="flex items-center gap-4">
                             <button className="flex items-center gap-2 text-neutral-500 hover:text-red-500 transition-colors">
                                 <Heart size={20} />
                                 <span>124</span>
                             </button>
                             <button className="flex items-center gap-2 text-neutral-500 hover:text-blue-500 transition-colors">
                                 <MessageCircle size={20} />
                                 <span>8</span>
                             </button>
                         </div>
                         <button className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
                             <Share2 size={20} />
                             <span>シェア</span>
                         </button>
                    </div>
                </div>

            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function BlockRenderer({ block }: { block: BlockData }) {
    switch (block.type) {
        case 'h2':
            return <h2 className="text-2xl font-bold mt-12 mb-6 text-neutral-800 border-b pb-2 border-neutral-100">{block.content}</h2>;
        case 'image':
            return (
                 <figure className="my-8">
                     <div className="bg-neutral-100 aspect-video rounded-lg flex items-center justify-center text-neutral-400">
                         [画像プレビュー]
                     </div>
                 </figure>
            );
        case 'html':
            return (
                <div className="my-8 p-4 bg-neutral-50 rounded border border-neutral-200 font-mono text-xs overflow-x-auto">
                    {block.content || "<HTML Embed />"}
                </div>
            );
        default:
            return <p className="leading-loose mb-6 text-neutral-700">{block.content}</p>;
    }
}