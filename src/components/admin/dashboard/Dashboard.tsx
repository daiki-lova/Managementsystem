'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layout, FileText, Tags, FolderOpen, Settings,
  Plus, Search, MoreHorizontal, ArrowUpRight,
  BarChart2, Calendar as CalendarIcon, Check, Trash2, ChevronDown,
  Star, Layers, Save, Globe, Zap, GripVertical, PenTool,
  User, Shield, LogOut, Image as ImageIcon, Copy, Eye, X, ArrowUpDown, ArrowDownAZ, ArrowUpZA,
  MessageCircle, Newspaper, Sparkles, Maximize2, MoreVertical, Pen,
  Home, Bot, Database, Command, BrainCircuit, Target,
  SquarePen, MousePointerClick, SquareUser, UserCheck
} from 'lucide-react';
import { ja } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { cn } from '@/app/admin/lib/utils';
import type { Article } from '@/app/admin/lib/types';
import { AnalyticsView } from './AnalyticsView';
import { AuthorsView } from './AuthorsView';
import { CategoriesView } from './CategoriesView';
import { KnowledgeBankView } from './KnowledgeBankView';
import { TagsView } from './TagsView';
import { ArticlePreviewModal } from './ArticlePreviewModal';
import { SettingsView } from './SettingsView';
import { StrategyView, GeneratedArticleData } from './StrategyView';
import { ConversionsView } from './ConversionsView';
import { MediaLibraryView } from './MediaLibraryView';
import { PostsView } from './PostsView';
import { useAuth } from '@/app/admin/lib/auth-context';

// UI Components
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

export type DashboardTab = 'home' | 'posts' | 'tags' | 'categories' | 'analytics' | 'strategy' | 'conversions' | 'authors' | 'settings' | 'media' | 'knowledge';

interface DashboardProps {
  onNavigateToEditor: (articleId?: string, initialTitle?: string) => void;
  isMobile?: boolean;
  onLogout?: () => void;
  initialTab?: DashboardTab;
}

type UserRole = 'owner' | 'writer';

export function Dashboard({ onNavigateToEditor, isMobile = false, onLogout, initialTab = 'home' }: DashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const userRole: UserRole = user?.role === 'OWNER' ? 'owner' : 'writer';
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeTab with initialTab when it changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Handle bulk generation complete - just navigate to posts tab
  // The articles are created via API in StrategyView, so we just need to switch tabs
  const handleBulkGenerate = useCallback((_articles: GeneratedArticleData[]) => {
    setActiveTab('posts');
  }, []);

  // Memoized tab change handlers to prevent unnecessary re-renders
  const handleTabHome = useCallback(() => setActiveTab('home'), []);
  const handleTabPosts = useCallback(() => setActiveTab('posts'), []);
  const handleTabStrategy = useCallback(() => setActiveTab('strategy'), []);
  const handleTabKnowledge = useCallback(() => setActiveTab('knowledge'), []);
  const handleTabConversions = useCallback(() => setActiveTab('conversions'), []);
  const handleTabMedia = useCallback(() => setActiveTab('media'), []);
  const handleTabCategories = useCallback(() => setActiveTab('categories'), []);
  const handleTabTags = useCallback(() => setActiveTab('tags'), []);
  const handleTabAuthors = useCallback(() => setActiveTab('authors'), []);
  const handleTabSettings = useCallback(() => setActiveTab('settings'), []);
  const handleOpenModelDialog = useCallback(() => setIsModelDialogOpen(true), []);
  const handleCloseModelDialog = useCallback(() => setIsModelDialogOpen(false), []);
  const handleOpenInviteDialog = useCallback(() => setIsInviteDialogOpen(true), []);
  const handleCloseInviteDialog = useCallback(() => setIsInviteDialogOpen(false), []);
  const handleCloseCategoryDialog = useCallback(() => setIsCategoryCreateDialogOpen(false), []);
  const handleClosePreview = useCallback(() => setPreviewArticleId(null), []);
  const handlePreviewArticle = useCallback((article: { id: string }) => setPreviewArticleId(article.id), []);

  // Dialog States
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isCategoryCreateDialogOpen, setIsCategoryCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');

  // Reset tab if current tab is not allowed for role


  // Force 'home' tab on mobile
  useEffect(() => {
    if (isMobile && activeTab !== 'home') {
      setActiveTab('home');
    }
  }, [isMobile, activeTab]);

  return (
    <div className="h-full w-full bg-[#F5F7FA] flex text-neutral-900 font-sans">
      {/* Preview Modal */}
      {previewArticleId && (
        <ArticlePreviewModal
          articleId={previewArticleId}
          isOpen={!!previewArticleId}
          onClose={handleClosePreview}
        />
      )}

      {/* Sidebar - Hidden on Mobile */}
      {!isMobile && (
        <aside className="w-64 bg-[#F5F7FA] fixed inset-y-0 left-0 z-10 flex flex-col px-4">
          <div className="h-6" /> {/* Spacer */}

          <div
            className="px-4 mb-6 mt-2 cursor-pointer group"
            onClick={handleTabHome}
          >
            <h1 className="font-bold text-xl tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">Radiance</h1>
            <p className="text-[10px] font-medium text-neutral-400 tracking-wide mt-0.5 uppercase">Media Management</p>
          </div>

          <nav className="flex-1 space-y-1 py-2 overflow-y-auto scrollbar-hide">
            <div className="mb-4">
              <NavItem
                icon={<Home size={18} strokeWidth={2} />}
                label="ホーム"
                isActive={activeTab === 'home'}
                onClick={handleTabHome}
              />
            </div>

            {/* Content Management */}
            <div className="mb-4">
              <div className="px-4 mb-1.5 flex items-center justify-between group">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Content</div>
                <button
                  onClick={handleOpenModelDialog}
                  className="p-1 hover:bg-white rounded-full transition-colors outline-none shadow-sm opacity-0 group-hover:opacity-100"
                >
                  <Plus size={12} className="text-neutral-400 hover:text-neutral-900 transition-colors" />
                </button>
              </div>

              <NavItem
                icon={<SquarePen size={18} strokeWidth={2} />}
                label="AI記事企画"
                isActive={activeTab === 'strategy'}
                onClick={handleTabStrategy}
              />

              <NavItem
                icon={<FileText size={18} strokeWidth={2} />}
                label="記事一覧"
                isActive={activeTab === 'posts'}
                onClick={handleTabPosts}
              />
            </div>

            {/* Assets Management */}
            <div className="mb-4">
              <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Assets</div>
              <NavItem
                icon={<Database size={18} strokeWidth={2} />}
                label="情報バンク"
                isActive={activeTab === 'knowledge'}
                onClick={handleTabKnowledge}
              />
              <NavItem
                icon={<MousePointerClick size={18} strokeWidth={2} />}
                label="コンバージョン"
                isActive={activeTab === 'conversions'}
                onClick={handleTabConversions}
              />
              <NavItem
                icon={<ImageIcon size={18} strokeWidth={2} />}
                label="メディア"
                isActive={activeTab === 'media'}
                onClick={handleTabMedia}
              />
            </div>

            {/* Master Data */}
            <div className="mb-4">
              <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Master</div>
              <NavItem
                icon={<FolderOpen size={18} strokeWidth={2} />}
                label="カテゴリー"
                isActive={activeTab === 'categories'}
                onClick={handleTabCategories}
              />
              <NavItem
                icon={<Tags size={18} strokeWidth={2} />}
                label="タグ"
                isActive={activeTab === 'tags'}
                onClick={handleTabTags}
              />
              <NavItem
                icon={<UserCheck size={18} strokeWidth={2} />}
                label="監修者"
                isActive={activeTab === 'authors'}
                onClick={handleTabAuthors}
              />

            </div>

            {/* System & Analytics */}
            <div className="mb-4">
              <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">System</div>

              <NavItem
                icon={<Settings size={18} strokeWidth={2} />}
                label="システム設定"
                isActive={activeTab === 'settings'}
                onClick={handleTabSettings}
              />
            </div>

          </nav>

          <div className="py-4 mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-2 w-full bg-white shadow-sm rounded-full hover:shadow transition-all text-left outline-none group border border-neutral-100">
                  <Avatar className="h-8 w-8 border border-neutral-100">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />}
                    <AvatarFallback className="text-xs bg-neutral-900 text-white">
                      {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-neutral-900 truncate">
                      {user?.name || user?.email || 'ユーザー'}
                    </span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                      {userRole === 'owner' ? 'Owner' : 'Writer'}
                    </span>
                  </div>
                  <MoreHorizontal size={14} className="text-neutral-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenInviteDialog}>
                  <div className="flex items-center gap-2">
                    <User size={14} /> メンバーを招待
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onLogout}>
                  <LogOut size={14} className="mr-2" /> ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 h-full",
        isMobile ? "pl-0" : "pl-64"
      )}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="h-14 border-b border-neutral-100 flex items-center justify-between px-4 flex-none bg-white">
            <span className="font-bold text-sm">Dashboard</span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="text-neutral-500">
              <LogOut size={16} />
            </Button>
          </div>
        )}

        <div className="w-full h-full overflow-hidden flex flex-col">
          {/* Main Content Area */}
          <div className="w-full h-full flex flex-col bg-transparent">
            {activeTab === 'home' && (
              <div className={cn(
                "h-full w-full overflow-y-auto",
                isMobile ? "p-0" : "p-8"
              )}>
                <AnalyticsView
                  onCreateArticle={onNavigateToEditor}
                  onNavigateToPosts={handleTabPosts}
                  isMobile={isMobile}
                />
              </div>
            )}
            {activeTab === 'posts' && (
              <div className="h-full overflow-hidden">
                <PostsView
                  onNavigateToEditor={onNavigateToEditor}
                  userRole={userRole}
                  onPreview={handlePreviewArticle}
                  onSwitchToStrategy={handleTabStrategy}
                />
              </div>
            )}
            {activeTab === 'strategy' && (
              <div className="h-full overflow-y-auto">
                <StrategyView
                  onGenerate={handleBulkGenerate}
                />
              </div>
            )}
            {activeTab === 'knowledge' && (
              <div className="h-full overflow-hidden">
                <KnowledgeBankView />
              </div>
            )}
            {activeTab === 'authors' && (
              <div className="h-full overflow-hidden">
                <AuthorsView />
              </div>
            )}
            {activeTab === 'conversions' && (
              <div className="h-full overflow-y-auto">
                <ConversionsView />
              </div>
            )}
            {activeTab === 'media' && <div className="h-full overflow-hidden"><MediaLibraryView /></div>}
            {activeTab === 'categories' && (
              <div className="h-full overflow-y-auto">
                <CategoriesView />
              </div>
            )}
            {activeTab === 'tags' && <div className="p-6 h-full overflow-y-auto"><TagsView /></div>}
            {activeTab === 'settings' && <div className="p-6 h-full overflow-y-auto"><SettingsView /></div>}
            {activeTab === 'analytics' && (
              <div className="p-8 h-full overflow-y-auto">
                <AnalyticsView
                  onCreateArticle={onNavigateToEditor}
                  onNavigateToPosts={handleTabPosts}
                />
              </div>
            )}
          </div>
        </div>
      </main >

      {/* Create Model Dialog */}
      < Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新しいモデルを作成</DialogTitle>
            <DialogDescription>
              管理するコンテンツの新しい種類を定義します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-name">モデル名</Label>
              <Input
                id="model-name"
                placeholder="例: スタッフ紹介、イベント情報"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-id">API識別子 (ID)</Label>
              <Input
                id="model-id"
                placeholder="例: staff, event"
                className="font-mono"
              />
              <p className="text-[10px] text-neutral-500">半角英数字とハイフンのみ使用可能です。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModelDialog}>キャンセル</Button>
            <Button type="submit" onClick={handleCloseModelDialog}>モデルを作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >


      {/* Create Category Dialog */}
      < Dialog open={isCategoryCreateDialogOpen} onOpenChange={setIsCategoryCreateDialogOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>カテゴリーを追加</DialogTitle>
            <DialogDescription>
              記事を分類するための新しいカテゴリーを作成します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">カテゴリー名</Label>
              <Input id="cat-name" placeholder="例: ヨガレッスン" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-slug">スラッグ</Label>
              <Input id="cat-slug" placeholder="例: yoga-lesson" className="font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCategoryDialog}>キャンセル</Button>
            <Button type="submit" onClick={handleCloseCategoryDialog}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Invite Member Dialog */}
      < Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>メンバーを招待</DialogTitle>
            <DialogDescription>
              新しいメンバーをプロジェクトに招待します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">メールアドレス</Label>
              <Input id="invite-email" placeholder="email@example.com" type="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">権限</Label>
              <Select defaultValue="writer">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理者 (Admin)</SelectItem>
                  <SelectItem value="writer">ライター (Writer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseInviteDialog}>キャンセル</Button>
            <Button type="submit" onClick={handleCloseInviteDialog}>招待メールを送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

    </div >
  );
}

const NavItem = React.memo(function NavItem({ icon, label, isActive, onClick, count }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 mb-1 text-sm font-medium rounded-lg transition-all relative group",
        isActive
          ? "text-neutral-900 bg-white shadow-sm ring-1 ring-neutral-200/60"
          : "text-neutral-500 hover:bg-neutral-200/50 hover:text-neutral-900"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "transition-colors",
          isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-500"
        )}>
          {icon}
        </div>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={cn(
          "text-[10px] py-0.5 px-1.5 rounded-full transition-colors",
          isActive ? "bg-neutral-100 text-neutral-900 font-bold" : "bg-neutral-200/50 text-neutral-500 group-hover:bg-neutral-200"
        )}>
          {count}
        </span>
      )}
    </button>
  );
});