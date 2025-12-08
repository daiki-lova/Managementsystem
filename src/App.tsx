'use client'

import { AnalyticsOverlay } from './components/analytics/AnalyticsOverlay';
import { Dashboard, DashboardTab } from './components/dashboard/Dashboard';
import { GlobalHeader } from './components/GlobalHeader';
import { EditorCanvas } from './components/editor/EditorCanvas';
import { ArticlePreview } from './components/preview/ArticlePreview';
import { LoginView } from './components/auth/LoginView';
import { MobileRestrictionView } from './components/mobile/MobileRestrictionView';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";
import { Calendar } from './components/ui/calendar';
import { Button } from './components/ui/button';
import type { AppMode, BlockData, ViewState } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [mode, setMode] = useState<AppMode>('write');
  const [status, setStatus] = useState<'draft' | 'saving' | 'saved'>('saved');
  const [articleStatus, setArticleStatus] = useState<'draft' | 'review' | 'published' | 'scheduled'>('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');

  // Schedule Dialog State
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());

  // Mobile Detection
  useEffect(() => {
      const checkMobile = () => {
          setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Article State
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  
  // Article Metadata State
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [ogImage, setOgImage] = useState<string | undefined>();

  const handleApplyAiSuggestion = (newTitle: string) => {
    setStatus('saving');
    setTimeout(() => {
      setTitle(newTitle);
      setStatus('saved');
    }, 800);
  };

  const handlePublish = () => {
    const isUpdating = articleStatus === 'published';
    setStatus('saving');
    
    if (isUpdating) {
        toast("更新処理を開始しました...", {
            description: "変更内容を反映しています。",
        });
    } else {
        toast("公開処理を開始しました...", {
            description: "記事のバリデーションとビルドを実行中です。",
        });
    }

    setTimeout(() => {
        setStatus('saved');
        setArticleStatus('published');
        
        if (isUpdating) {
             toast.success("記事を更新しました！", {
                description: "最新の内容が公開されました。",
            });
            // For update, we might stay in editor or go back?
            // Usually stay in editor for quick fixes, but let's consistent with publish
            // Let's stay in editor for update, go back for new publish?
            // User request didn't specify, but usually updates allow continued editing.
            // Let's keep it simple and just toast success for now.
        } else {
            toast.success("記事を公開しました！", {
                description: "記事一覧画面に戻ります。",
            });
            // Return to dashboard after a short delay only for new publish
             setTimeout(() => {
                setDashboardTab('posts');
                setView('dashboard');
            }, 1500);
        }
    }, 2000);
  };

  const handleScheduleOpen = () => {
      setScheduleDate(new Date());
      setIsScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = () => {
      if (!scheduleDate) return;

      setStatus('saving');
      setIsScheduleDialogOpen(false);
      
      // Mock Scheduling Process
      setTimeout(() => {
          setStatus('saved');
          setArticleStatus('scheduled');
          toast.success("公開予約が完了しました", {
              description: `${format(scheduleDate, 'yyyy年MM月dd日 HH:mm', { locale: ja })} に公開されます。`,
          });
          
           setTimeout(() => {
            setDashboardTab('posts');
            setView('dashboard');
        }, 1500);
      }, 1000);
  };

  const handleUnpublish = () => {
      if (confirm("記事を非公開にしますか？\n公開済みの記事が見られなくなります。")) {
          setStatus('saving');
          setTimeout(() => {
            setStatus('saved');
            setArticleStatus('draft');
            toast("記事を非公開にしました", {
                description: "下書きとして保存されました。",
            });
          }, 800);
      }
  };

  const handleSaveDraft = () => {
      setStatus('saving');
      setTimeout(() => {
        setStatus('saved');
        setArticleStatus('draft');
        toast.success("下書きとして保存しました", {
            description: "いつでも編集を再開できます。",
        });
      }, 800);
  };

  const handleNavigateToEditor = (articleId?: string, initialTitle?: string) => {
      if (articleId === 'a2') { // Scenario: "瞑想を続けるための3つのコツ" (AI Generated Draft)
          setTitle(initialTitle || '瞑想を続けるための3つのコツ');
          setBlocks([
              { id: '1', type: 'p', content: '「瞑想が良いのはわかっているけど、なかなか続かない...」そんな悩みをお持ちではありませんか？実は、瞑想の習慣化に失敗する人の多くが、ある「誤解」をしています。' },
              { id: '2', type: 'h2', content: 'なぜ瞑想は続かないのか？' },
              { id: '3', type: 'p', content: '瞑想が続かない最大の理由は、「無になろう」としすぎることです。雑念が浮かぶのは脳の正常な機能であり、それを無理に消そうとするとストレスになります。' },
              { id: '4', type: 'h2', content: '1. 「1分」から始める' },
              { id: '5', type: 'p', content: '最初から20分やろうとする必要はありません。1日1分、深呼吸をするだけでも十分な効果があります。トイレ休憩や電車待ちの時間など、隙間時間を活用しましょう。' },
              { id: '6', type: 'h2', content: '2. 場所と時間を決める' },
              { id: '7', type: 'p', content: '「時間があるときにやる」ではなく、「朝起きてすぐ」「寝る前」など、既存の習慣にくっつける（If-Thenプランニング）が有効です。' },
              { id: '8', type: 'h2', content: '3. 完璧を目指さない' },
              { id: '9', type: 'p', content: 'できない日があっても自分を責めないでください。「今日はできなかったな」と気づくだけでも、それは一つのマインドフルネスです。' },
              { id: '10', type: 'h2', content: 'まとめ' },
              { id: '11', type: 'p', content: '瞑想は筋トレと同じで、すぐに効果が出るものではありません。しかし、細く長く続けることで、確実にメンタルは整っていきます。まずは今日の1分から始めてみませんか？' },
          ]);
          setThumbnail("https://images.unsplash.com/photo-1754257320362-5982d5cd58ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400");
          setCategory("コラム");
          setTags(["瞑想", "習慣化", "マインドフルネス"]);
          setSlug("meditation-tips");
          setDescription("瞑想が続かない人向けに、脳科学に基づいた習慣化のコツを3つ紹介します。");
          setArticleStatus('draft'); // Reset to draft for editing scenario
      } else if (initialTitle) {
          // Other existing articles
          setTitle(initialTitle);
          setBlocks([{ id: '1', type: 'p', content: 'ここに本文を入力してください...' }]);
          setThumbnail(undefined);
          setCategory("");
          setTags([]);
          setSlug("");
          setDescription("");
          setArticleStatus('draft');
      } else {
          // New Article
          setTitle(''); 
          setBlocks([{ id: '1', type: 'p', content: '' }]);
          setThumbnail(undefined);
          setCategory("");
          setTags([]);
          setSlug("");
          setDescription("");
          setArticleStatus('draft');
      }
      setView('editor');
  };

  if (!isAuthenticated) {
      return (
          <>
            <LoginView onLogin={() => setIsAuthenticated(true)} />
            <Toaster />
          </>
      );
  }

  // Mobile Restriction Logic for Non-Dashboard Views
  if (isMobile && view !== 'dashboard') {
      return <MobileRestrictionView onBackToHome={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
        <>
            <Dashboard 
                onNavigateToEditor={handleNavigateToEditor} 
                isMobile={isMobile}
                onLogout={() => setIsAuthenticated(false)}
                initialTab={dashboardTab}
            />
            <Toaster />
        </>
    );
  }

  return (
    <div className="h-screen bg-[#F5F7FA] text-neutral-900 font-sans selection:bg-blue-100 flex flex-col overflow-hidden">
      <Toaster />
      {/* Global Navigation */}
      <div className="flex-none z-50">
        <GlobalHeader 
            mode={mode} 
            setMode={setMode} 
            status={status} 
            articleStatus={articleStatus}
            onBack={() => {
                setDashboardTab('posts');
                setView('dashboard');
            }}
            onPreview={() => setShowPreview(true)}
            onPublish={handlePublish}
            onSchedule={handleScheduleOpen}
            onSaveDraft={handleSaveDraft}
            onUnpublish={handleUnpublish}
            title={title}
            thumbnail={thumbnail}
        />
      </div>

      <ArticlePreview 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={title}
        blocks={blocks}
        thumbnail={thumbnail}
        category={category}
        tags={tags}
      />
      
      {/* Editor Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>公開日時を設定</DialogTitle>
            </DialogHeader>
            <div className="py-4 flex justify-center">
                <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    className="rounded-md border"
                    locale={ja}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>キャンセル</Button>
                <Button onClick={handleScheduleConfirm}>予約する</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 overflow-y-auto relative pt-8">
        {/* Write Mode (Always rendered, essentially the base layer) */}
        <EditorCanvas 
          title={title} 
          setTitle={setTitle} 
          blocks={blocks} 
          setBlocks={setBlocks}
          mode={mode}
          // Metadata props
          thumbnail={thumbnail}
          setThumbnail={setThumbnail}
          category={category}
          setCategory={setCategory}
          tags={tags}
          setTags={setTags}
          slug={slug}
          setSlug={setSlug}
          description={description}
          setDescription={setDescription}
          metaTitle={metaTitle}
          setMetaTitle={setMetaTitle}
          ogImage={ogImage}
          setOgImage={setOgImage}
          isPublished={articleStatus === 'published'}
        />
      </main>
    </div>
  );
}