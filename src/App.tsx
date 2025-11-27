import { AnalyticsOverlay } from './components/analytics/AnalyticsOverlay';
import { Dashboard, DashboardTab } from './components/dashboard/Dashboard';
import { GlobalHeader } from './components/GlobalHeader';
import { EditorCanvas } from './components/editor/EditorCanvas';
import { ArticlePreview } from './components/preview/ArticlePreview';
import { LoginView } from './components/auth/LoginView';
import { MobileRestrictionView } from './components/mobile/MobileRestrictionView';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import type { AppMode, BlockData, ViewState } from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [mode, setMode] = useState<AppMode>('write');
  const [status, setStatus] = useState<'draft' | 'saving' | 'saved'>('saved');
  const [showPreview, setShowPreview] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('home');

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
      } else if (initialTitle) {
          // Other existing articles
          setTitle(initialTitle);
          setBlocks([{ id: '1', type: 'p', content: 'ここに本文を入力してください...' }]);
          setThumbnail(undefined);
          setCategory("");
          setTags([]);
          setSlug("");
          setDescription("");
      } else {
          // New Article
          setTitle(''); 
          setBlocks([{ id: '1', type: 'p', content: '' }]);
          setThumbnail(undefined);
          setCategory("");
          setTags([]);
          setSlug("");
          setDescription("");
      }
      setView('editor');
  };

  if (!isAuthenticated) {
      return <LoginView onLogin={() => setIsAuthenticated(true)} />;
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
            onLogout={() => setIsAuthenticated(false)}
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
            onBack={() => {
            setDashboardTab('posts');
            setView('dashboard');
            }}
            onPreview={() => setShowPreview(true)}
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
        />
      </main>
    </div>
  );
}
