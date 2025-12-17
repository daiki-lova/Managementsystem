import React, { useState } from 'react';
import { 
  X, Smartphone, Tablet, Monitor, Share, ExternalLink, 
  Calendar, Clock, Tag, User 
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '../ui/dialog'; // Added Title, Description
import { Button } from '../ui/button';
import { cn } from '@/app/admin/lib/utils';
import type { Article } from '@/app/admin/lib/types';

interface ArticlePreviewModalProps {
  article: Article & { category?: string };
  isOpen: boolean;
  onClose: () => void;
}

export function ArticlePreviewModal({ article, isOpen, onClose }: ArticlePreviewModalProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-[95vw] w-full h-[90vh] p-0 flex flex-col bg-neutral-100 overflow-hidden border-none rounded-xl"
        aria-describedby="preview-description" // Explicitly associate description
      >
        {/* Accessibility: Visually Hidden Title & Description if not clearly in view, but we can put them in header */}
        <div className="sr-only">
            <DialogTitle>記事プレビュー: {article.title}</DialogTitle>
            <DialogDescription id="preview-description">
                {device}モードでの記事の表示確認画面です。
            </DialogDescription>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-4 h-14 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-4">
                <h2 className="font-bold text-sm text-neutral-500" aria-hidden="true">プレビューモード</h2>
                <div className="h-4 w-px bg-neutral-200" />
                <div className="flex items-center bg-neutral-100 rounded-lg p-1">
                    <button 
                        onClick={() => setDevice('desktop')}
                        className={cn("p-1.5 rounded-md transition-colors", device === 'desktop' ? "bg-white shadow-sm text-black" : "text-neutral-400 hover:text-neutral-600")}
                        title="Desktop View"
                    >
                        <Monitor size={16} />
                    </button>
                    <button 
                        onClick={() => setDevice('tablet')}
                        className={cn("p-1.5 rounded-md transition-colors", device === 'tablet' ? "bg-white shadow-sm text-black" : "text-neutral-400 hover:text-neutral-600")}
                         title="Tablet View"
                    >
                        <Tablet size={16} />
                    </button>
                    <button 
                        onClick={() => setDevice('mobile')}
                        className={cn("p-1.5 rounded-md transition-colors", device === 'mobile' ? "bg-white shadow-sm text-black" : "text-neutral-400 hover:text-neutral-600")}
                         title="Mobile View"
                    >
                        <Smartphone size={16} />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 mr-2 hidden sm:inline">
                    最終更新: {article.updatedAt}
                </span>
                <Button variant="outline" size="sm" className="h-8 gap-2 hidden sm:flex">
                    <Share size={14} /> 共有URL発行
                </Button>
                <Button size="sm" className="h-8 gap-2" onClick={() => window.open('#', '_blank')}>
                    <ExternalLink size={14} /> 別タブで開く
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={onClose}>
                    <X size={18} />
                </Button>
            </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center p-8 bg-neutral-100/50">
            <div 
                className={cn(
                    "bg-white shadow-xl transition-all duration-300 origin-top overflow-hidden flex flex-col",
                    device === 'desktop' && "w-[1200px] min-h-[800px] rounded-none border-x border-neutral-200",
                    device === 'tablet' && "w-[768px] min-h-[1024px] rounded-2xl my-4 border-8 border-neutral-800",
                    device === 'mobile' && "w-[375px] min-h-[667px] rounded-3xl my-4 border-[12px] border-neutral-800",
                )}
            >
                {/* Mock Browser Header for Desktop */}
                {device === 'desktop' && (
                     <div className="h-8 bg-neutral-100 border-b border-neutral-200 flex items-center gap-2 px-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-white h-5 rounded text-[10px] text-neutral-400 flex items-center px-2 mx-4 truncate">
                            https://makeblog.com/posts/{article.id}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {article.category && (
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
                                    {article.category}
                                </span>
                            )}
                            {article.tags.map(tag => (
                                <span key={tag} className="inline-block px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-6">
                            {article.title}
                        </h1>

                        <div className="flex items-center gap-6 text-sm text-neutral-500 mb-12 border-b border-neutral-100 pb-6">
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                {article.author}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {article.updatedAt}
                            </div>
                             <div className="flex items-center gap-2">
                                <Clock size={16} />
                                3 min read
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="aspect-video bg-neutral-100 rounded-xl w-full mb-12 flex items-center justify-center text-neutral-300 overflow-hidden">
                            <img 
                                src={`https://source.unsplash.com/random/1200x630?${article.tags[0] || 'blog'}`} 
                                alt="Article Thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.src = "https://placehold.co/1200x630?text=No+Image")}
                            />
                        </div>

                        {/* Body Mock Content */}
                        <div className="prose prose-neutral lg:prose-lg max-w-none">
                            <p className="lead">
                                ブログ運用において、最も重要なのは「継続すること」です。しかし、多くの人が記事を書くことに疲れ、やめてしまいます。なぜなら、執筆体験が心地よくないことと、成果が見えにくいことが原因です。
                            </p>
                            
                            <h2>なぜ続かないのか？</h2>
                            <p>
                                従来のCMSは機能が多すぎて複雑か、あるいはシンプルすぎて機能不足かのどちらかでした。<br/>
                                「もっと直感的に書きたい」「でもデータは詳しく見たい」<br/>
                                そんな矛盾する願いを叶えるために、このシステムは開発されました。
                            </p>

                            <h3>直感的なエディタ</h3>
                            <p>
                                書くことに集中できるUI。余計なボタンは排除し、必要な時だけ現れるツールバー。まるで白いキャンバスに絵を描くように、あなたの思考を記事にできます。
                            </p>

                            <blockquote>
                                "Simple is best. But simple is difficult." - Design Philosophy
                            </blockquote>

                            <h3>データドリブンな意思決定</h3>
                            <p>
                                GA4やSearch Consoleと連携し、どの記事が読まれているかだけでなく、「なぜ読まれているか」をAIが分析します。次に書くべきテーマも提案してくれるので、ネタ切れの心配もありません。
                            </p>
                            
                            <ul>
                                <li>AIによるタイトル提案</li>
                                <li>SEOスコアのリアルタイム分析</li>
                                <li>読者層の可視化</li>
                            </ul>

                            <p>
                                さあ、新しいブログ運用の世界へ飛び込みましょう。
                            </p>
                        </div>
                    </article>

                    {/* Footer Mock */}
                    <footer className="border-t border-neutral-100 mt-20 py-12 bg-neutral-50">
                        <div className="max-w-3xl mx-auto px-6 text-center text-neutral-400 text-sm">
                            &copy; 2024 MakeBlog. All rights reserved.
                        </div>
                    </footer>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
