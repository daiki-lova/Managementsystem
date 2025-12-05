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
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { cn } from '../../lib/utils';
import type { Article, Category, ConversionItem, Profile, KnowledgeItem } from '../../types';
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
import { PostsView, ExtendedArticle } from './PostsView';

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

// Mock Master Data
const AVAILABLE_CATEGORIES = ["レッスン", "コラム", "知識", "ライフスタイル", "動画", "ハウツー", "重要", "スタッフ", "ダイエット成功", "体質改善", "キャリアチェンジ"];
const AVAILABLE_TAGS = ["ヨガ", "ピラティス", "初心者向け", "健康", "比較", "瞑想", "マインドフルネス", "メンタルヘルス", "ストレッチ", "自宅トレ", "セルフケア", "お知らせ", "営業案内", "人事", "インストラクター", "メンテナンス", "システム", "ダイエット", "30代", "初心者", "健康改善", "腰痛", "40代", "キャリア", "資格取得"];

const MOCK_PROFILES_DATA: Profile[] = [
    { 
        id: 'mika', 
        name: 'Mika Sensei', 
        slug: 'mika-sensei',
        role: 'ヨガインストラクター', 
        qualifications: 'RYT200, マタニティヨガ認定',
        categories: ['ヨガ', 'ストレッチ', '瞑想'],
        tags: ['初心者歓迎', '産後ケア', '骨盤矯正'],
        instagram: 'https://instagram.com/mika_yoga',
        facebook: 'https://facebook.com/mikayoga',
        avatar: 'https://images.unsplash.com/photo-1658279445014-dcc466ac1192?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
        bio: '初心者から上級者まで、心と体に寄り添う指導を心がけています。',
        systemPrompt: 'ヨガインストラクターの視点で、解剖学的な根拠に基づきつつ、初心者にも親しみやすい語り口で執筆してください。専門用語には必ず補足を入れ、読者が実践したくなるような動機付けを行ってください。'
    },
    { 
        id: 'sarah', 
        name: 'Sarah Smith', 
        slug: 'sarah-smith',
        role: 'シニアエディター', 
        qualifications: '管理栄養士, 健康運動指導士',
        categories: ['食事', '栄養', 'ダイエット'],
        tags: ['低糖質', 'タンパク質', '海外トレンド'],
        avatar: 'https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
        bio: 'エビデンスに基づいた健康情報を分かりやすく発信します。',
        systemPrompt: 'ピラティスの専門家として、インナーマッスルの働きや姿勢改善効果を論理的に解説し、洗練された都会的なトーンで執筆してください。機能解剖学の観点を重視してください。' 
    },
    {
        id: 'kenji',
        name: 'Kenji Yamamoto',
        slug: 'kenji-yamamoto',
        role: 'ピラティス講師',
        qualifications: 'Pilates Method Alliance, 理学療法士',
        categories: ['ピラティス', 'リハビリ'],
        tags: ['体幹トレーニング', '腰痛改善', '姿勢改善'],
        avatar: 'https://images.unsplash.com/photo-1738566061505-556830f8b8f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
        bio: '理学療法士の視点から、安全で効果的なピラティスを指導します。'
    },
    {
        id: 'akiko',
        name: 'Akiko Tanaka',
        slug: 'akiko-tanaka',
        role: 'フードコーディネーター',
        qualifications: '調理師, 食生活アドバイザー',
        categories: ['レシピ', '食事'],
        tags: ['ヴィーガン', 'グルテンフリー', 'オーガニック'],
        avatar: 'https://images.unsplash.com/photo-1517778968789-3eea19b05c18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
        bio: '美味しくて体に優しいヘルシーレシピを提案しています。'
    },
    {
        id: 'yuri',
        name: 'Yuri Sato',
        slug: 'yuri-sato',
        role: 'マインドフルネスコーチ',
        qualifications: 'MBSR修了, 臨床心理士',
        categories: ['瞑想', 'メンタルケア'],
        tags: ['ストレス解消', '睡眠改善', 'マインドフルネス'],
        avatar: 'https://images.unsplash.com/photo-1698230557068-96c3658c2215?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=100',
        bio: '心のバランスを整えるための瞑想ガイドを行っています。'
    },
    { 
        id: 'admin', 
        name: 'Admin', 
        slug: 'admin',
        role: '管理者',
        qualifications: '',
        categories: ['お知らせ', 'システム'],
        tags: ['公式', 'メンテナンス'],
        bio: 'サイト管理者'
    },
];

const MOCK_CATEGORIES_DATA: Category[] = [
    { 
        id: 'c1', 
        name: 'ヨガ', 
        slug: 'yoga', 
        description: '心と体のバランスを整えるヨガのポーズや呼吸法について', 
        count: 124,
        supervisorName: '高橋 エマ',
        supervisorRole: 'RYT200 認定講師',
        supervisorImage: 'https://images.unsplash.com/photo-1676578732408-134d55bc408d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYSUyMHlvZ2ElMjBpbnN0cnVjdG9yJTIwZmVtYWxlJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2NDI0NzYwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        color: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    { 
        id: 'c2', 
        name: 'ピラティス', 
        slug: 'pilates', 
        description: 'インナーマッスルを鍛え、姿勢を改善するピラティス', 
        count: 85,
        supervisorName: 'Sarah Jen',
        supervisorRole: 'BASIピラティス',
        supervisorImage: 'https://images.unsplash.com/photo-1761034278072-baa90a7d28d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBpbGF0ZXMlMjBpbnN0cnVjdG9yJTIwZmVtYWxlJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc2NDI0NzYwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        color: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    { 
        id: 'c3', 
        name: '食事・栄養', 
        slug: 'food', 
        description: '健康的で美しい体を作るための食事法とレシピ', 
        count: 210,
        supervisorName: '鈴木 栄養士',
        supervisorRole: '管理栄養士',
        supervisorImage: 'https://images.unsplash.com/photo-1601341348280-550b5e87281b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYSUyMG51dHJpdGlvbmlzdCUyMGZlbWFsZSUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjQyNDc2MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        color: 'bg-green-50 text-green-700 border-green-100'
    },
    { 
        id: 'c4', 
        name: '瞑想・マインドフルネス', 
        slug: 'meditation', 
        description: 'ストレスを軽減し、集中力を高める瞑想ガイド', 
        count: 45,
        supervisorName: 'David Moon',
        supervisorRole: '瞑想指導者',
        supervisorImage: 'https://images.unsplash.com/photo-1748288166888-f1bd5d6ef9ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYSUyMG1hbGUlMjBjb3Vuc2Vsb3IlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY0MjQ3NjA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        color: 'bg-purple-50 text-purple-700 border-purple-100'
    },
    { 
        id: 'c5', 
        name: 'ライフスタイル', 
        slug: 'lifestyle', 
        description: 'ウェルビーイングな毎日を送るためのヒント', 
        count: 156,
        supervisorName: 'Admin',
        supervisorRole: '編集部',
        color: 'bg-neutral-100 text-neutral-700 border-neutral-200'
    },
];

const MOCK_CONVERSIONS_DATA: ConversionItem[] = [
    {
        id: 'cv1',
        name: '冬の体験レッスン半額キャンペーン',
        type: 'campaign',
        url: 'https://yoga-studio.demo/campaign/winter-2024',
        thumbnail: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=500',
        status: 'active',
        ctr: '2.4%',
        clicks: 840,
        cv: 42,
        period: '2024/12/01 - 2025/01/31'
    },
    {
        id: 'cv2',
        name: '公式アプリダウンロード訴求',
        type: 'app',
        url: 'https://yoga-studio.demo/app',
        thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=500',
        status: 'active',
        ctr: '1.8%',
        clicks: 1250,
        cv: 156,
        period: '常設'
    },
    {
        id: 'cv3',
        name: '無料カウンセリング予約',
        type: 'evergreen',
        url: 'https://yoga-studio.demo/counseling',
        status: 'active',
        ctr: '1.2%',
        clicks: 420,
        cv: 18,
        period: '常設'
    },
    {
        id: 'cv4',
        name: '【終了】秋の入会金無料キャンペーン',
        type: 'campaign',
        url: 'https://yoga-studio.demo/campaign/autumn',
        thumbnail: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=500',
        status: 'ended',
        ctr: '3.1%',
        clicks: 2100,
        cv: 210,
        period: '2024/09/01 - 2024/11/30'
    }
];

const MOCK_KNOWLEDGE_DATA: KnowledgeItem[] = [
    {
        id: 'k1',
        content: 'OREOのRYT200コースを受講して、身体が硬い私でも無理なく続けられました。特に解剖学の授業が分かりやすく、なぜこのポーズをするのかが理解できて良かったです。',
        brand: 'OREO',
        course: 'RYT200',
        authorId: 'mika', 
        authorName: 'Mika Sensei',
        createdAt: '2024-11-25T10:00:00Z',
        usageCount: 5,
        source: 'spreadsheet',
        sourceType: 'text',
        kind: 'STUDENT_VOICE'
    },
    {
        id: 'k2',
        content: 'シークエンスの短期集中講座は本当に短期間で詰め込むので大変でしたが、その分成長を感じられました。',
        brand: 'SEQUENCE',
        course: '短期集中',
        createdAt: '2024-11-20T15:30:00Z',
        usageCount: 2,
        source: 'manual',
        sourceType: 'text',
        kind: 'STUDENT_VOICE'
    },
    {
        id: 'k3',
        content: 'https://docs.google.com/spreadsheets/d/1BxiMvs0Xqui5gX2w2PFKyq3mgdIb1Jt/edit#gid=0',
        brand: 'OREO',
        course: 'RYT200',
        kind: 'STUDENT_VOICE',
        createdAt: '2024-11-28T09:00:00Z',
        usageCount: 0,
        source: 'spreadsheet',
        sourceType: 'url'
    },
    {
        id: 'k4',
        content: 'https://www.youtube.com/watch?v=xPPLbEFbCAo',
        brand: 'ALL',
        kind: 'EXTERNAL',
        createdAt: '2024-11-28T10:15:00Z',
        usageCount: 1,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k5',
        content: 'https://yoga-story.jp/blog/beginners-guide-2024',
        brand: 'OREO',
        kind: 'AUTHOR_ARTICLE',
        authorId: 'mika',
        authorName: 'Mika Sensei',
        createdAt: '2024-11-27T14:20:00Z',
        usageCount: 3,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k6',
        content: 'ピラティスのレッスンを受けてから、長年の腰痛が改善しました。インナーマッスルの重要性を実感しています。インストラクターの説明も論理的で分かりやすかったです。',
        brand: 'SEQUENCE',
        course: 'ピラティス基礎',
        kind: 'STUDENT_VOICE',
        createdAt: '2024-11-15T08:30:00Z',
        usageCount: 4,
        source: 'manual',
        sourceType: 'text'
    },
    {
        id: 'k7',
        content: 'https://ci.nii.ac.jp/naid/130007668390',
        brand: 'ALL',
        kind: 'EXTERNAL',
        createdAt: '2024-11-10T11:00:00Z',
        usageCount: 0,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k8',
        content: 'オンライン授業の画質と音声が非常にクリアで、スタジオにいるような臨場感がありました。質問タイムも設けられており、サポート体制がしっかりしていると感じました。',
        brand: 'OREO',
        course: 'RYT200',
        kind: 'STUDENT_VOICE',
        createdAt: '2024-11-18T16:45:00Z',
        usageCount: 1,
        source: 'spreadsheet',
        sourceType: 'text'
    },
    {
        id: 'k9',
        content: 'https://www.mhlw.go.jp/content/000656456.pdf',
        brand: 'ALL',
        kind: 'EXTERNAL',
        createdAt: '2024-11-05T09:20:00Z',
        usageCount: 6,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k10',
        content: 'マタニティヨガの指導法について、安全面での配慮が非常に細かく指導されました。妊婦さんへの声掛けのバリエーションも学べ、実践的な内容でした。',
        brand: 'OREO',
        course: 'RPY85',
        kind: 'STUDENT_VOICE',
        authorId: 'mika',
        authorName: 'Mika Sensei',
        createdAt: '2024-10-30T13:10:00Z',
        usageCount: 2,
        source: 'manual',
        sourceType: 'text'
    },
    {
        id: 'k11',
        content: 'https://instagram.com/p/Cz123456789',
        brand: 'SEQUENCE',
        kind: 'AUTHOR_ARTICLE',
        authorId: 'sarah',
        authorName: 'Sarah Smith',
        createdAt: '2024-11-22T19:00:00Z',
        usageCount: 0,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k12',
        content: '卒業後のキャリアサポートについて相談に乗ってもらいました。オーディション対策や履歴書の書き方まで指導していただき、無事にスタジオ就職が決まりました。',
        brand: 'OREO',
        course: 'RYT200',
        kind: 'STUDENT_VOICE',
        createdAt: '2024-10-25T10:00:00Z',
        usageCount: 3,
        source: 'spreadsheet',
        sourceType: 'text'
    },
    {
        id: 'k13',
        content: 'https://www.yoga-journal.jp/article/12345',
        brand: 'ALL',
        kind: 'EXTERNAL',
        createdAt: '2024-11-12T14:30:00Z',
        usageCount: 1,
        source: 'manual',
        sourceType: 'url'
    },
    {
        id: 'k14',
        content: 'キッズヨガの資格取得コースを受講。子供たちが楽しめるようなゲーム感覚のアプローチや、集中力を保つための工夫など、目から鱗の連続でした。保育士の仕事にも活かせそうです。',
        brand: 'OREO',
        course: 'RCYT95',
        kind: 'STUDENT_VOICE',
        createdAt: '2024-10-15T11:20:00Z',
        usageCount: 0,
        source: 'manual',
        sourceType: 'text'
    },
    {
        id: 'k15',
        content: 'https://note.com/sequence_pilates/n/n1234567890',
        brand: 'SEQUENCE',
        kind: 'AUTHOR_ARTICLE',
        authorId: 'kenji',
        authorName: 'Kenji Yamamoto',
        createdAt: '2024-11-01T18:00:00Z',
        usageCount: 4,
        source: 'manual',
        sourceType: 'url'
    }
];

// Mock Data
const MOCK_ARTICLES_DATA: ExtendedArticle[] = [
    { 
      id: 'a1', 
      title: '初心者向けヨガマットの選び方決定版', 
      status: 'scheduled', 
      updatedAt: '2024-11-25 10:00', 
      publishedAt: '2024-11-26 09:00',
      pv: 0, 
      tags: ['ヨガ', '初心者向け', '道具'], 
      categories: ['コラム'], 
      author: 'Admin', 
      authorName: 'AI + Admin',
      thumbnail: 'https://images.unsplash.com/photo-1761971975047-6426232852ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      slug: 'yoga-mat-guide'
    },
    { 
      id: 'a2', 
      title: '瞑想を続けるための3つのコツ', 
      status: 'review', 
      updatedAt: '2024-11-25 14:30', 
      publishedAt: '-',
      pv: 0, 
      tags: ['瞑想', '習慣化'], 
      categories: ['コラム'], 
      author: 'Admin', 
      authorName: 'AI (Model-v4)',
      thumbnail: 'https://images.unsplash.com/photo-1754257320362-5982d5cd58ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      slug: 'meditation-tips' 
    },
    // Legacy manual articles below
    { 
      id: 'm1', 
      title: '【体験談】ヨガインストラクター資格取得までの道のり', 
      status: 'published', 
      updatedAt: '2024-11-24 15:00', 
      publishedAt: '2024-11-25 08:00',
      pv: 1200, 
      tags: ['ヨガ', '資格', 'キャリア'], 
      categories: ['コラム'], 
      author: 'Admin', 
      authorName: 'Mika Sensei',
      thumbnail: 'https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      slug: 'yoga-instructor-path'
    },
    { 
      id: '5', 
      title: 'インストラクター直伝！自宅でできる簡単ストレッチ', 
      status: 'published', 
      updatedAt: '2024-02-28 15:45', 
      publishedAt: '2024-02-28 16:00',
      pv: 5400, 
      tags: ['ストレッチ', '自宅トレ', 'セルフケア'], 
      categories: ['動画', 'ハウツー'], 
      author: 'Admin', 
      authorName: 'Mika Sensei',
      thumbnail: 'https://images.unsplash.com/photo-1758599879024-7379d769f664?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      slug: 'home-stretching-guide'
    },
];

const MOCK_TESTIMONIALS_DATA: ExtendedArticle[] = [];

export type DashboardTab = 'home' | 'posts' | 'tags' | 'categories' | 'analytics' | 'strategy' | 'conversions' | 'authors' | 'settings' | 'media' | 'knowledge';

interface DashboardProps {
  onNavigateToEditor: (articleId?: string, initialTitle?: string) => void;
  isMobile?: boolean;
  onLogout?: () => void;
  initialTab?: DashboardTab;
}

type UserRole = 'owner' | 'writer';

export function Dashboard({ onNavigateToEditor, isMobile = false, onLogout, initialTab = 'home' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [previewArticle, setPreviewArticle] = useState<(Article & { category?: string, categories?: string[] }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync activeTab with initialTab when it changes
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);
  
  // Lifted State for Articles
  const [posts, setPosts] = useState<ExtendedArticle[]>(MOCK_ARTICLES_DATA);
  
  // Lifted State for Master Data
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES_DATA);
  const [conversions, setConversions] = useState<ConversionItem[]>(MOCK_CONVERSIONS_DATA);
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES_DATA);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE_DATA);

  const filteredPosts = posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.slug && post.slug.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
      setSearchQuery('');
  }, [activeTab]);

  const handleBulkGenerate = (articles: GeneratedArticleData[]) => {
    const newPosts: ExtendedArticle[] = articles.map((article, index) => ({
        id: `ai-gen-${Date.now()}-${index}`,
        title: article.title,
        status: article.status as any,
        updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
        publishedAt: article.publishedAt,
        pv: 0,
        tags: ['AI生成'],
        categories: [article.category],
        author: 'AI Assistant',
        authorName: 'AI Assistant',
        thumbnail: undefined,
        slug: ''
    }));

    setPosts([...newPosts, ...posts]);
    setActiveTab('posts');
  };
  
  // Dialog States
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [isCategoryCreateDialogOpen, setIsCategoryCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelId, setNewModelId] = useState('');

  // Reset tab if current tab is not allowed for role
  useEffect(() => {
      if (userRole === 'writer') {
          const allowedTabs = ['home', 'posts', 'strategy', 'media', 'conversions', 'knowledge'];
          // @ts-ignore
          if (!allowedTabs.includes(activeTab)) {
              setActiveTab('home');
          }
      }
  }, [userRole, activeTab]);

  // Force 'home' tab on mobile
  useEffect(() => {
      if (isMobile && activeTab !== 'home') {
          setActiveTab('home');
      }
  }, [isMobile, activeTab]);

  return (
    <div className="h-full w-full bg-[#F5F7FA] flex text-neutral-900 font-sans">
      {/* Preview Modal */}
      {previewArticle && (
          <ArticlePreviewModal 
              article={{
                  ...previewArticle,
                  // Compatibility adapter for preview modal which expects single category string
                  category: previewArticle.categories?.[0] || previewArticle.category || ''
              }} 
              isOpen={!!previewArticle} 
              onClose={() => setPreviewArticle(null)} 
          />
      )}

      {/* Sidebar - Hidden on Mobile */}
      {!isMobile && (
      <aside className="w-64 bg-[#F5F7FA] fixed inset-y-0 left-0 z-10 flex flex-col px-4">
        <div className="h-6" /> {/* Spacer */}

        <div 
            className="px-4 mb-6 mt-2 cursor-pointer group"
            onClick={() => setActiveTab('home')}
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
                onClick={() => setActiveTab('home')}
            />
           </div>

          {/* Content Management */}
          <div className="mb-4">
            <div className="px-4 mb-1.5 flex items-center justify-between group">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Content</div>
                <button 
                    onClick={() => setIsModelDialogOpen(true)}
                    className="p-1 hover:bg-white rounded-full transition-colors outline-none shadow-sm opacity-0 group-hover:opacity-100"
                >
                    <Plus size={12} className="text-neutral-400 hover:text-neutral-900 transition-colors" />
                </button>
            </div>
            
            <NavItem 
                icon={<SquarePen size={18} strokeWidth={2} />} 
                label="AI記事企画" 
                isActive={activeTab === 'strategy'} 
                onClick={() => setActiveTab('strategy')}
            />
            
            <NavItem 
                icon={<FileText size={18} strokeWidth={2} />} 
                label="記事一覧" 
                isActive={activeTab === 'posts'} 
                onClick={() => setActiveTab('posts')}
                count={MOCK_ARTICLES_DATA.length}
            />
          </div>

          {/* Assets Management */}
          <div className="mb-4">
            <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Assets</div>
             <NavItem 
                icon={<Database size={18} strokeWidth={2} />} 
                label="情報バンク" 
                isActive={activeTab === 'knowledge'} 
                onClick={() => setActiveTab('knowledge')}
                count={knowledgeItems.length}
            />
             <NavItem 
                icon={<MousePointerClick size={18} strokeWidth={2} />} 
                label="コンバージョン" 
                isActive={activeTab === 'conversions'} 
                onClick={() => setActiveTab('conversions')}
            />
            <NavItem 
                icon={<ImageIcon size={18} strokeWidth={2} />} 
                label="メディア" 
                isActive={activeTab === 'media'} 
                onClick={() => setActiveTab('media')}
            />
          </div>

          {/* Master Data */}
          {userRole === 'owner' && (
              <div className="mb-4">
                <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Master</div>
                <NavItem 
                    icon={<FolderOpen size={18} strokeWidth={2} />}
                    label="カテゴリー" 
                    isActive={activeTab === 'categories'} 
                    onClick={() => setActiveTab('categories')}
                    count={categories.length}
                />
                <NavItem 
                    icon={<Tags size={18} strokeWidth={2} />}
                    label="タグ" 
                    isActive={activeTab === 'tags'} 
                    onClick={() => setActiveTab('tags')}
                    count={24}
                />
                <NavItem 
                    icon={<UserCheck size={18} strokeWidth={2} />}
                    label="監修者" 
                    isActive={activeTab === 'authors'} 
                    onClick={() => setActiveTab('authors')}
                    count={profiles.length}
                />

              </div>
          )}
          
          {/* System & Analytics */}
          {userRole === 'owner' && (
              <div className="mb-4">
                <div className="px-4 mb-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">System</div>

                <NavItem 
                    icon={<Settings size={18} strokeWidth={2} />} 
                    label="システム設定" 
                    isActive={activeTab === 'settings'}
                    onClick={() => setActiveTab('settings')}
                />
              </div>
          )}

        </nav>

        <div className="py-4 mt-auto">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 px-3 py-2 w-full bg-white shadow-sm rounded-full hover:shadow transition-all text-left outline-none group border border-neutral-100">
                        <Avatar className="h-8 w-8 border border-neutral-100">
                            <AvatarFallback className="text-xs bg-neutral-900 text-white">AD</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-neutral-900 truncate">
                                Admin User
                            </span>
                            <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                                Owner
                            </span>
                        </div>
                        <MoreHorizontal size={14} className="text-neutral-400" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>マイアカウント</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsInviteDialogOpen(true)}>
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

        <div className={cn(
          "w-full h-full overflow-hidden flex flex-col",
          ['home', 'analytics'].includes(activeTab) ? "" : "p-6 overflow-y-auto"
        )}>
          {/* Card Container for Main Content */}
          <div className={cn(
              "w-full h-full flex flex-col",
              ['home', 'analytics'].includes(activeTab) ? "bg-transparent" : "bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
          )}>
              
            {activeTab === 'home' && (
                <div className={cn(
                    "h-full w-full overflow-y-auto",
                    isMobile ? "p-0" : "p-8"
                )}>
                    <AnalyticsView 
                        onCreateArticle={(title) => onNavigateToEditor(undefined, title)} 
                        onNavigateToPosts={() => setActiveTab('posts')}
                        isMobile={isMobile}
                    />
                </div>
            )}
            {activeTab === 'posts' && (
                <div className="p-6 h-full overflow-y-auto">
                    <PostsView 
                        data={filteredPosts}
                        onDataChange={setPosts}
                        onNavigateToEditor={onNavigateToEditor}
                        userRole={userRole}
                        onPreview={setPreviewArticle}
                        onSwitchToStrategy={() => setActiveTab('strategy')}
                    />
                </div>
            )}
            {activeTab === 'strategy' && (
                <div className="h-full overflow-y-auto">
                    <StrategyView 
                        onGenerate={handleBulkGenerate}
                        onManageConversions={() => setActiveTab('conversions')}
                        onNavigateToCategories={() => setActiveTab('categories')}
                        categories={categories}
                        conversions={conversions}
                        knowledgeItems={knowledgeItems}
                        authors={profiles}
                    />
                </div>
            )}
            {activeTab === 'knowledge' && (
                <div className="h-full overflow-y-auto">
                    <KnowledgeBankView 
                        items={knowledgeItems}
                        onItemsChange={setKnowledgeItems}
                        authors={profiles}
                    />
                </div>
            )}
            {userRole === 'owner' && activeTab === 'authors' && (
                <div className="p-6 h-full overflow-y-auto">
                    <AuthorsView 
                        profiles={profiles}
                        onProfilesChange={setProfiles}
                    />
                </div>
            )}
            {activeTab === 'conversions' && (
                <div className="p-6 h-full overflow-y-auto">
                    <ConversionsView 
                        conversions={conversions}
                        onConversionsChange={setConversions}
                    />
                </div>
            )}
            {activeTab === 'media' && <div className="p-6 h-full overflow-y-auto"><MediaLibraryView /></div>}
            {userRole === 'owner' && activeTab === 'categories' && (
                <div className="p-6 h-full overflow-y-auto">
                    <CategoriesView 
                        categories={categories}
                        onCategoriesChange={setCategories}
                    />
                </div>
            )}
            {userRole === 'owner' && activeTab === 'tags' && <div className="p-6 h-full overflow-y-auto"><TagsView /></div>}
            {userRole === 'owner' && activeTab === 'settings' && <div className="p-6 h-full overflow-y-auto"><SettingsView /></div>}
            {userRole === 'owner' && activeTab === 'analytics' && (
                <div className="p-8 h-full overflow-y-auto">
                    <AnalyticsView 
                        onCreateArticle={(title) => onNavigateToEditor(undefined, title)} 
                        onNavigateToPosts={() => setActiveTab('posts')}
                    />
                </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Model Dialog */}
      <Dialog open={isModelDialogOpen} onOpenChange={setIsModelDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsModelDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" onClick={() => setIsModelDialogOpen(false)}>モデルを作成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Create Category Dialog */}
      <Dialog open={isCategoryCreateDialogOpen} onOpenChange={setIsCategoryCreateDialogOpen}>
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
             <Button variant="outline" onClick={() => setIsCategoryCreateDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" onClick={() => setIsCategoryCreateDialogOpen(false)}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
             <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>キャンセル</Button>
            <Button type="submit" onClick={() => {
                // Show toast here if possible
                setIsInviteDialogOpen(false);
            }}>招待メールを送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick, count }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, count?: number }) {
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
}
