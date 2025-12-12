'use client'

import { Dashboard, DashboardTab } from './components/dashboard/Dashboard';
import { GlobalHeader } from './components/GlobalHeader';
import { EditorCanvas } from './components/editor/EditorCanvas';
import { ArticlePreview } from './components/preview/ArticlePreview';
import { LoginView } from './components/auth/LoginView';
import { MobileRestrictionView } from './components/mobile/MobileRestrictionView';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
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
import { useAuth } from './lib/auth-context';
import { useArticle } from './lib/hooks';

export default function App() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [mode, setMode] = useState<AppMode>('write');
  const [status, setStatus] = useState<'draft' | 'saving' | 'saved'>('saved');
  const [articleStatus, setArticleStatus] = useState<'draft' | 'review' | 'published' | 'scheduled'>('draft');
  const [showPreview, setShowPreview] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');

  // Current editing article ID
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [articleVersion, setArticleVersion] = useState(1);

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

  // Fetch article data when editing
  const { data: articleData } = useArticle(currentArticleId);

  // Sync state with fetched article data
  useEffect(() => {
    if (currentArticleId && articleData) {
      setTitle(articleData.title);

      // Merge inserted images into blocks
      const baseBlocks = (articleData.blocks as BlockData[]) || [];
      const insertedImages = articleData.images || [];

      if (insertedImages.length > 0) {
        // Create a mutable copy of blocks
        const mergedBlocks = [...baseBlocks];

        // Get unique images by type (use the latest one for each type)
        const inserted1 = insertedImages.filter((img: any) => img.type === 'INSERTED_1').pop();
        const inserted2 = insertedImages.filter((img: any) => img.type === 'INSERTED_2').pop();

        // Calculate insertion positions based on article structure
        // INSERTED_1: After block 4 (after intro and first section)
        // INSERTED_2: After block 8 (middle of article)
        const totalBlocks = mergedBlocks.length;
        const pos1 = Math.min(4, totalBlocks);
        const pos2 = Math.min(9, totalBlocks + (inserted1 ? 1 : 0));

        // Insert INSERTED_2 first (higher index) to avoid position shift
        if (inserted2) {
          const imageBlock2: BlockData = {
            id: `img-inserted-2-${inserted2.id}`,
            type: 'image',
            content: inserted2.url,
            metadata: { altText: inserted2.altText || '', source: 'AI_GENERATED', imageType: 'INSERTED_2' }
          };
          mergedBlocks.splice(pos2, 0, imageBlock2);
        }

        // Insert INSERTED_1
        if (inserted1) {
          const imageBlock1: BlockData = {
            id: `img-inserted-1-${inserted1.id}`,
            type: 'image',
            content: inserted1.url,
            metadata: { altText: inserted1.altText || '', source: 'AI_GENERATED', imageType: 'INSERTED_1' }
          };
          mergedBlocks.splice(pos1, 0, imageBlock1);
        }

        setBlocks(mergedBlocks);
      } else {
        setBlocks(baseBlocks);
      }

      setThumbnail(articleData.media_assets?.url || articleData.thumbnail?.url);
      setCategory(articleData.category?.name || "");
      setTags(articleData.article_tags?.map(at => at.tags.name) || []);
      setSlug(articleData.slug);
      setDescription(articleData.metaDescription || "");
      // @ts-ignore
      setMetaTitle(articleData.metaTitle || "");
      setArticleStatus((articleData.status?.toLowerCase() as any) || 'draft');
      setArticleVersion(articleData.version || 1);
    }
  }, [currentArticleId, articleData]);




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
      } else {
        toast.success("記事を公開しました！", {
          description: "記事一覧画面に戻ります。",
        });
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
    // Logic for new article or specific mocked article
    if (articleId === 'a2') {
      setCurrentArticleId(articleId);
      // Mock data handling (kept as is for 'a2')
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
      setArticleStatus('draft');
      setArticleVersion(1);
    } else if (articleId) {
      // Existing article: Set ID and let useEffect load the data
      setCurrentArticleId(articleId);
      if (initialTitle) {
        // Temporarily set title while loading
        setTitle(initialTitle);
      }
      // Do NOT reset state here; let useEffect handle it
    } else {
      // New article
      setCurrentArticleId(null);
      setTitle(initialTitle || '');
      setBlocks([{ id: '1', type: 'p', content: '' }]);
      setThumbnail(undefined);
      setCategory("");
      setTags([]);
      setSlug("");
      setDescription("");
      setArticleStatus('draft');
      setArticleVersion(1);
    }
    setView('editor');
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
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
          onLogout={logout}
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
