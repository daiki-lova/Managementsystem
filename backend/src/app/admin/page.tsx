'use client';

import { Dashboard, DashboardTab } from '@/components/admin/dashboard/Dashboard';
import { GlobalHeader } from '@/components/admin/GlobalHeader';
import { EditorCanvas } from '@/components/admin/editor/EditorCanvas';
import { ArticlePreview } from '@/components/admin/preview/ArticlePreview';
import { LoginView } from '@/components/admin/auth/LoginView';
import { MobileRestrictionView } from '@/components/admin/mobile/MobileRestrictionView';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/admin/ui/dialog";
import { Calendar } from '@/components/admin/ui/calendar';
import { Button } from '@/components/admin/ui/button';
import { Input } from '@/components/admin/ui/input';
import type { AppMode, BlockData, ViewState } from './lib/types';
import { useAuth } from './lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { useArticle, useCategories, useTags, useCreateArticle, useUpdateArticle } from './lib/hooks';
import { ApiError, articlesApi } from './lib/api';

export default function AdminPage() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const queryClient = useQueryClient();
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
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Schedule Dialog State
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });

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
  const { data: categoriesData } = useCategories({ page: 1, limit: 200 });
  const { data: tagsData } = useTags({ page: 1, limit: 200 });

  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

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

      setThumbnail(articleData.media_assets?.url);
      setCategory(articleData.categories?.name || "");
      setTags(
        (articleData.tags?.map((t) => t.name) ??
          // Backward compatibility if API returns join table shape
          (articleData as any).article_tags?.map((at: any) => at.tags?.name) ??
          [])
          .filter(Boolean)
      );
      setSlug(articleData.slug);
      setDescription(articleData.metaDescription || "");
      setMetaTitle(articleData.metaTitle || "");
      setArticleStatus((articleData.status?.toLowerCase() as any) || 'draft');
      setArticleVersion(articleData.version || 1);
      setLastSavedAt(articleData.updatedAt ? new Date(articleData.updatedAt) : null);
    }
  }, [currentArticleId, articleData]);

  const resolveCategoryId = () => {
    const categories = categoriesData?.data ?? [];
    const found = categories.find((c: any) => c.name === category);
    return found?.id as string | undefined;
  };

  const resolveTagIds = () => {
    const tagsList = tagsData?.data ?? [];
    const byName = new Map<string, string>();
    tagsList.forEach((t: any) => byName.set(t.name, t.id));
    const ids: string[] = [];
    for (const name of tags) {
      const id = byName.get(name);
      if (!id) return { ok: false as const, missing: name };
      ids.push(id);
    }
    return { ok: true as const, ids };
  };

  const serializeBlocksForApi = (blocksToSend: BlockData[]) =>
    blocksToSend.map((b) => ({
      id: b.id,
      type: b.type,
      content: b.content,
      data: b.metadata ?? undefined,
    }));

  const ensureSavedDraft = async (): Promise<{ id: string; version: number }> => {
    if (!title.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'タイトルを入力してください', 400);
    }

    const tagIdsResult = resolveTagIds();
    if ('ok' in tagIdsResult && !tagIdsResult.ok) {
      throw new ApiError('VALIDATION_ERROR', `タグ「${tagIdsResult.missing}」が存在しません（オーナーに作成を依頼してください）`, 400);
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      blocks: serializeBlocksForApi(blocks),
      metaTitle: metaTitle.trim() ? metaTitle.trim() : undefined,
      metaDescription: description.trim() ? description.trim() : undefined,
      categoryId: resolveCategoryId(),
      tagIds: 'ok' in tagIdsResult ? tagIdsResult.ids : undefined,
      status: 'DRAFT' as const,
    };

    if (!currentArticleId) {
      const response = await createArticle.mutateAsync(payload as any);
      const newId = response.data?.id;
      if (!newId) throw new ApiError('INTERNAL_ERROR', '記事IDの取得に失敗しました', 500);
      setCurrentArticleId(newId);
      setArticleVersion(1);
      setLastSavedAt(new Date());
      return { id: newId, version: 1 };
    }

    const response = await updateArticle.mutateAsync({
      id: currentArticleId,
      data: {
        ...payload,
        version: articleVersion,
      } as any,
    });

    const nextVersion = response.data?.version ?? (articleVersion + 1);
    setArticleVersion(nextVersion);
    setLastSavedAt(new Date());
    return { id: currentArticleId, version: nextVersion };
  };

  const handleApplyAiSuggestion = (newTitle: string) => {
    setStatus('saving');
    setTimeout(() => {
      setTitle(newTitle);
      setStatus('saved');
    }, 800);
  };

  const handlePublish = () => {
    (async () => {
      setStatus('saving');
      try {
        const saved = await ensureSavedDraft();
        const result = await articlesApi.publish(saved.id, saved.version);
        setArticleStatus('published');
        setArticleVersion(result.data?.version ?? saved.version);
        setLastSavedAt(new Date());
        toast.success('記事を公開しました');
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        queryClient.invalidateQueries({ queryKey: ['articles', saved.id] });
        setDashboardTab('posts');
        setView('dashboard');
      } catch (err) {
        const message = err instanceof ApiError ? err.message : '公開に失敗しました';
        toast.error(message);
      } finally {
        setStatus('saved');
      }
    })();
  };

  const handleScheduleOpen = () => {
    setScheduleDate(new Date());
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setScheduleTime(`${hh}:${mm}`);
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = () => {
    if (!scheduleDate) return;
    (async () => {
      setStatus('saving');
      setIsScheduleDialogOpen(false);
      try {
        const saved = await ensureSavedDraft();
        const [hh, mm] = scheduleTime.split(':').map((v) => Number(v));
        const scheduled = new Date(scheduleDate);
        if (Number.isFinite(hh)) scheduled.setHours(hh);
        if (Number.isFinite(mm)) scheduled.setMinutes(mm);
        scheduled.setSeconds(0, 0);
        const scheduledAt = scheduled.toISOString();
        const result = await articlesApi.schedule(saved.id, scheduledAt, saved.version);
        setArticleStatus('scheduled');
        setArticleVersion(result.data?.version ?? saved.version);
        setLastSavedAt(new Date());
        toast.success('公開予約が完了しました', {
          description: `${format(scheduled, 'yyyy年MM月dd日 HH:mm', { locale: ja })} に公開されます。`,
        });
        queryClient.invalidateQueries({ queryKey: ['articles'] });
        queryClient.invalidateQueries({ queryKey: ['articles', saved.id] });
        setDashboardTab('posts');
        setView('dashboard');
      } catch (err) {
        const message = err instanceof ApiError ? err.message : '公開予約に失敗しました';
        toast.error(message);
      } finally {
        setStatus('saved');
      }
    })();
  };

  const handleUnpublish = () => {
    if (confirm("記事を非公開にしますか？\n公開済みの記事が見られなくなります。")) {
      (async () => {
        setStatus('saving');
        try {
          if (!currentArticleId) {
            toast.error('記事がまだ作成されていません');
            return;
          }
          const result = await updateArticle.mutateAsync({
            id: currentArticleId,
            data: { status: 'DRAFT', version: articleVersion } as any,
          });
          setArticleStatus('draft');
          setArticleVersion(result.data?.version ?? (articleVersion + 1));
          setLastSavedAt(new Date());
          toast('記事を非公開にしました', {
            description: '下書きとして保存されました。',
          });
        } catch (err) {
          if (err instanceof ApiError && err.code === 'CONFLICT') {
            return;
          }
          const message = err instanceof ApiError ? err.message : '非公開に失敗しました';
          toast.error(message);
        } finally {
          setStatus('saved');
        }
      })();
    }
  };

  const handleSaveDraft = () => {
    (async () => {
      setStatus('saving');
      try {
        await ensureSavedDraft();
        setArticleStatus('draft');
        toast.success('下書きとして保存しました', {
          description: 'いつでも編集を再開できます。',
        });
      } catch (err) {
        if (err instanceof ApiError && err.code === 'CONFLICT') {
          return;
        }
        const message = err instanceof ApiError ? err.message : '下書き保存に失敗しました';
        toast.error(message);
      } finally {
        setStatus('saved');
      }
    })();
  };

  const handleNavigateToEditor = (articleId?: string, initialTitle?: string) => {
    if (articleId === 'a2') {
      setCurrentArticleId(articleId);
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
      setCurrentArticleId(articleId);
      if (initialTitle) {
        setTitle(initialTitle);
      }
    } else {
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
    return <LoginView />;
  }

  // Mobile Restriction Logic for Non-Dashboard Views
  if (isMobile && view !== 'dashboard') {
    return <MobileRestrictionView onBackToHome={() => setView('dashboard')} />;
  }

  if (view === 'dashboard') {
    return (
      <Dashboard
        onNavigateToEditor={handleNavigateToEditor}
        isMobile={isMobile}
        onLogout={logout}
        initialTab={dashboardTab}
      />
    );
  }

  return (
    <div className="h-screen bg-[#F5F7FA] text-neutral-900 font-sans selection:bg-blue-100 flex flex-col overflow-hidden">
      {/* Global Navigation */}
      <div className="flex-none z-50">
        <GlobalHeader
          mode={mode}
          setMode={setMode}
          status={status}
          articleStatus={articleStatus}
          lastSavedAt={lastSavedAt}
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
          <div className="px-1 pb-2">
            <label className="text-sm text-neutral-600">時間</label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="mt-2"
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
