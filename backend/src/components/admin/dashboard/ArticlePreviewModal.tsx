'use client';

import React, { useState } from 'react';
import {
  X, Smartphone, Monitor, ExternalLink, Copy, Check, Loader2, RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '@/app/admin/lib/utils';
import { useArticle } from '@/app/admin/lib/hooks';
import { toast } from 'sonner';
import type { ArticleBlock } from '@/app/admin/lib/api';

interface ArticlePreviewModalProps {
  articleId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ブロックをプレーンテキストに変換
function blocksToPlainText(blocks: ArticleBlock[], title: string): string {
  const body = blocks.map(block => {
    const content = block.content || '';
    switch (block.type) {
      case 'h2':
        return `\n## ${content}\n`;
      case 'h3':
        return `\n### ${content}\n`;
      case 'h4':
        return `\n#### ${content}\n`;
      case 'ul':
        return content.split('\n').filter(Boolean).map(item => `• ${item}`).join('\n') + '\n';
      case 'ol':
        return content.split('\n').filter(Boolean).map((item, i) => `${i + 1}. ${item}`).join('\n') + '\n';
      case 'blockquote':
        return `\n> ${content}\n`;
      case 'hr':
        return '\n---\n';
      default:
        return content + '\n';
    }
  }).join('\n');
  return `${title}\n\n${body}`;
}

export function ArticlePreviewModal({ articleId, isOpen, onClose }: ArticlePreviewModalProps) {
  const [viewMode, setViewMode] = useState<'both' | 'desktop' | 'mobile'>('both');
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 記事データを取得（コピー用）
  const { data: article, isLoading } = useArticle(isOpen ? articleId : null);

  const handleCopyContent = async () => {
    if (!article) return;

    const blocks = article.blocks as ArticleBlock[] || [];
    const fullText = blocksToPlainText(blocks, article.title);

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('記事をクリップボードにコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  // プレビュー用URL: /preview/{id} (認証付き、下書き記事も表示可能)
  const previewUrl = article?.id ? `/preview/${article.id}` : null;

  // 公開記事用の本番URL (別タブで開く用)
  const publicUrl = article?.slug && article?.categories?.slug && article?.status === 'PUBLISHED'
    ? `/${article.categories.slug}/${article.slug}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[98vw] w-full h-[95vh] p-0 flex flex-col bg-neutral-900 overflow-hidden border-none rounded-xl"
        aria-describedby="preview-description"
      >
        <div className="sr-only">
          <DialogTitle>記事プレビュー: {article?.title || '読み込み中...'}</DialogTitle>
          <DialogDescription id="preview-description">
            PCとスマートフォンでの記事の表示確認画面です。
          </DialogDescription>
        </div>

        {/* Header */}
        <div className="bg-neutral-800 border-b border-neutral-700 px-4 h-12 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-sm text-white">プレビュー</h2>
            <div className="h-4 w-px bg-neutral-600" />
            <div className="flex items-center bg-neutral-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('both')}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  viewMode === 'both' ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                )}
              >
                並列表示
              </button>
              <button
                onClick={() => setViewMode('desktop')}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors flex items-center gap-1",
                  viewMode === 'desktop' ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                )}
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors flex items-center gap-1",
                  viewMode === 'mobile' ? "bg-neutral-600 text-white" : "text-neutral-400 hover:text-white"
                )}
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} /> 更新
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700"
              onClick={handleCopyContent}
              disabled={!article || isLoading}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'コピー済み' : 'コピー'}
            </Button>
            {(publicUrl || previewUrl) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700"
                onClick={() => {
                  const url = publicUrl || previewUrl;
                  if (url) window.open(url, '_blank');
                }}
              >
                <ExternalLink size={14} /> {publicUrl ? '本番表示' : 'プレビュー'}
              </Button>
            )}
            <div className="w-px h-6 bg-neutral-600 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-700"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 p-6 bg-neutral-900">
          {isLoading || !previewUrl ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
          ) : (
            <div className={cn(
              "h-full flex gap-6",
              viewMode === 'both' && "justify-center",
              viewMode === 'desktop' && "justify-center",
              viewMode === 'mobile' && "justify-center",
            )}>
              {/* Desktop Preview */}
              {(viewMode === 'both' || viewMode === 'desktop') && (
                <div className="flex flex-col items-center">
                  <div className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <Monitor size={12} /> デスクトップ (1280px)
                  </div>
                  <div className={cn(
                    "bg-white rounded-lg overflow-hidden shadow-2xl flex flex-col",
                    viewMode === 'both' ? "w-[800px]" : "w-[1200px]"
                  )} style={{ height: 'calc(100% - 24px)' }}>
                    {/* Browser Chrome */}
                    <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center gap-2 px-3 shrink-0">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-white h-5 rounded text-[10px] text-neutral-400 flex items-center px-2 mx-2 truncate">
                        {window.location.origin}{previewUrl}
                      </div>
                    </div>
                    {/* Iframe */}
                    <iframe
                      key={`desktop-${refreshKey}`}
                      src={previewUrl}
                      className="flex-1 w-full border-0 overflow-auto"
                      style={{ minHeight: 0 }}
                      title="Desktop Preview"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Preview */}
              {(viewMode === 'both' || viewMode === 'mobile') && (
                <div className="flex flex-col items-center">
                  <div className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                    <Smartphone size={12} /> スマートフォン (375px)
                  </div>
                  <div
                    className="bg-neutral-800 rounded-[40px] p-3 shadow-2xl"
                    style={{ height: 'calc(100% - 24px)' }}
                  >
                    {/* Phone Frame */}
                    <div className="w-[375px] h-full bg-white rounded-[32px] flex flex-col relative overflow-hidden">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-800 rounded-b-2xl z-10" />
                      {/* Iframe */}
                      <iframe
                        key={`mobile-${refreshKey}`}
                        src={previewUrl}
                        className="flex-1 w-full border-0 pt-6 overflow-auto"
                        style={{ minHeight: 0 }}
                        title="Mobile Preview"
                      />
                      {/* Home Indicator */}
                      <div className="h-8 flex items-center justify-center shrink-0 bg-white">
                        <div className="w-32 h-1 bg-neutral-300 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
