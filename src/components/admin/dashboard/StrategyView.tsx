'use client'

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, CalendarDays, Loader2, Zap, TrendingUp, Database, FileText, Play, Minus, Plus, User, FolderOpen, Target, Image } from 'lucide-react';
import { cn } from '@/app/admin/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { GenerationProgressModal } from './GenerationProgressModal';
import {
    useCategories,
    useAuthors,
    useConversions,
    useKnowledgeBank,
    useCreateGenerationJob,
    useGenerationJobs,
} from '@/app/admin/lib/hooks';

export type GeneratedArticleData = {
    title: string;
    status: 'draft' | 'published' | 'scheduled';
    publishedAt: string;
    category: string;
    author?: string;
};

// パイプラインモード（V5のみサポート）
type PipelineMode = 'v5';

// 画像スタイル
type ImageStyleType = 'WATERCOLOR' | 'REALISTIC';

export function StrategyView({
    onGenerate,
}: {
    onGenerate: (articles: GeneratedArticleData[]) => void;
}) {
    // API Data fetching
    const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
    const { data: authorsData, isLoading: authorsLoading } = useAuthors();
    const { data: conversionsData, isLoading: conversionsLoading } = useConversions();
    const { data: knowledgeData } = useKnowledgeBank();

    const isDataLoading = categoriesLoading || authorsLoading || conversionsLoading;

    // Map API data
    const categories = useMemo(() => (categoriesData?.data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        articleCount: cat.articlesCount || cat._count?.articles || 0,
    })), [categoriesData]);

    const authors = useMemo(() => (authorsData?.data || []).map((author: any) => ({
        id: author.id,
        name: author.name,
        role: author.role || 'ライター',
    })), [authorsData]);

    const conversions = useMemo(() => (conversionsData?.data || [])
        .filter((cv: any) => cv.status === 'ACTIVE')
        .map((cv: any) => ({
            id: cv.id,
            name: cv.name,
            url: cv.url,
        })), [conversionsData]);

    const knowledgeItems = useMemo(() => (knowledgeData?.data || []).map((item: any) => ({
        id: item.id,
        title: item.title || item.content?.substring(0, 50) || '無題',
        content: item.content,
        categoryId: item.categoryId || null,
        usageCount: item.usageCount || 0,
    })), [knowledgeData]);

    // Mutations
    const createGenerationJob = useCreateGenerationJob();

    // パイプラインモードは固定（V5のみ）
    const pipelineMode: PipelineMode = 'v5';

    // User selections
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedAuthorId, setSelectedAuthorId] = useState<string>('');
    const [selectedConversionId, setSelectedConversionId] = useState<string>('');
    const [articleCount, setArticleCount] = useState(3);
    const [scheduleMode, setScheduleMode] = useState<'draft' | 'now' | 'schedule'>('draft');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [postTime, setPostTime] = useState<string>('09:00');
    const [imageStyle, setImageStyle] = useState<ImageStyleType>('WATERCOLOR');

    // Generation state
    const [genStatus, setGenStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
    const [generatedResult, setGeneratedResult] = useState<GeneratedArticleData[]>([]);

    // 選択されたカテゴリーに関連する情報バンクアイテム（または全体から未使用優先）
    const availableKnowledgeItems = useMemo(() => {
        let items = [...knowledgeItems];

        // カテゴリーが選択されていればそのカテゴリーのアイテムを優先
        if (selectedCategoryId) {
            const categoryItems = items.filter(k => k.categoryId === selectedCategoryId);
            const otherItems = items.filter(k => k.categoryId !== selectedCategoryId);
            items = [...categoryItems, ...otherItems];
        }

        // 使用回数でソート（少ない順）
        return items.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));
    }, [knowledgeItems, selectedCategoryId]);

    // 生成可能数（未使用の情報バンクアイテム数）
    const unusedCount = knowledgeItems.filter(k => (k.usageCount || 0) === 0).length;
    const maxGeneratable = unusedCount;

    // 選択が完了しているか
    const hasRequiredSelections = selectedCategoryId && selectedAuthorId && selectedConversionId;
    const canGenerate = hasRequiredSelections && unusedCount > 0 && articleCount > 0;

    // 選択されたものの表示名
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const selectedAuthor = authors.find(a => a.id === selectedAuthorId);
    const selectedConversion = conversions.find(c => c.id === selectedConversionId);

    const handleGenerate = async () => {
        if (!canGenerate) return;

        setProgressModalOpen(true);
        setGenStatus('processing');
        setCurrentStep(0);
        setProgress(0);
        setActiveJobIds([]);

        const brandId = 'd23546a5-6bbb-40e6-80f3-18e60fbaca34';
        const publishStrategy = scheduleMode === 'now' ? 'PUBLISH_NOW' :
            scheduleMode === 'schedule' ? 'SCHEDULED' : 'DRAFT';

        try {
            // 情報バンクから選択
            const selectedKnowledge = availableKnowledgeItems.slice(0, articleCount);
            if (selectedKnowledge.length === 0) {
                toast.error('生成可能なコンテンツがありません');
                return;
            }

            // V3: 受講生の声ベース / V5: 受講生の声 + Web検索 + LLMo最適化
            const result = await createGenerationJob.mutateAsync({
                categoryId: selectedCategoryId,
                authorId: selectedAuthorId,
                brandId,
                conversionIds: [selectedConversionId],
                knowledgeItemIds: selectedKnowledge.map(s => s.id),
                pipelineVersion: pipelineMode, // 'v3' or 'v5'
                publishStrategy: publishStrategy as 'DRAFT' | 'PUBLISH_NOW' | 'SCHEDULED',
                scheduledAt: scheduleMode === 'schedule' ? `${startDate}T${postTime}:00Z` : undefined,
                imageStyle, // 画像スタイル（WATERCOLOR or REALISTIC）
            });

            const jobIds = result.data?.jobs.map((j: any) => j.id) || [];
            setActiveJobIds(jobIds);

            toast.success(`${selectedKnowledge.length}件の記事生成を開始しました`);
        } catch (error) {
            console.error('Failed to create generation jobs:', error);
            setGenStatus('error');
            toast.error('記事生成の開始に失敗しました');
        }
    };

    // Poll job status
    const { data: jobsData } = useGenerationJobs({ limit: 10 });

    React.useEffect(() => {
        if (activeJobIds.length === 0 || !jobsData?.data) return;

        const activeJobs = jobsData.data.filter((job: any) => activeJobIds.includes(job.id));
        if (activeJobs.length === 0) return;

        const failedJob = activeJobs.find((job: any) => job.status === 'FAILED');
        if (failedJob) {
            setGenStatus('error');
            return;
        }

        const totalProgress = activeJobs.reduce((acc: number, job: any) => acc + (job.progress || 0), 0);
        const avgProgress = Math.floor(totalProgress / activeJobs.length);
        setProgress(avgProgress);

        // V5: 8ステップ
        let step = 0;
        if (avgProgress < 8) step = 0;
        else if (avgProgress < 16) step = 1;
        else if (avgProgress < 24) step = 2;
        else if (avgProgress < 36) step = 3;
        else if (avgProgress < 56) step = 4;
        else if (avgProgress < 76) step = 5;
        else if (avgProgress < 92) step = 6;
        else step = 7;
        setCurrentStep(step);

        const allCompleted = activeJobs.every((job: any) => job.status === 'COMPLETED');
        if (allCompleted) {
            const generatedArticles: GeneratedArticleData[] = activeJobs.flatMap((job: any) =>
                (job.articles || []).map((article: any) => ({
                    title: article.title,
                    status: article.status === 'PUBLISH_NOW' ? 'published' : article.status === 'SCHEDULED' ? 'scheduled' : 'draft',
                    publishedAt: article.publishedAt || new Date().toISOString(),
                    category: job.category?.name || 'カテゴリなし',
                    author: job.author?.name,
                }))
            );
            setGeneratedResult(generatedArticles);
            setGenStatus('completed');
        }
    }, [jobsData, activeJobIds, pipelineMode]);

    const handleComplete = () => {
        onGenerate(generatedResult);
        setProgressModalOpen(false);
    };

    if (isDataLoading) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                        <p className="text-sm text-neutral-500">データを読み込み中...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-neutral-50 to-white">
            {/* Header */}
            <header className="px-8 py-6 bg-white border-b border-neutral-100">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">AI記事生成</h1>
                <p className="text-sm text-neutral-500 mt-1">カテゴリー・監修者・コンバージョンを選択して記事を生成します</p>
            </header>

            <div className="flex-1 p-8 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Stats Overview */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <Database size={18} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">{knowledgeItems.length}</p>
                                    <p className="text-xs text-neutral-500">情報バンク</p>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-500">
                                未使用: <span className="font-medium text-blue-600">{unusedCount}件</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                    <FileText size={18} className="text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">{categories.reduce((sum, c) => sum + c.articleCount, 0)}</p>
                                    <p className="text-xs text-neutral-500">総記事数</p>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-500">
                                {categories.length}カテゴリー
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <TrendingUp size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-neutral-900">{maxGeneratable}</p>
                                    <p className="text-xs text-neutral-500">生成可能数</p>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-500">
                                未使用アイテム
                            </div>
                        </div>
                    </div>

                    {/* Selection Card */}
                    <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-200">
                                <Sparkles size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900">生成設定</h2>
                                <p className="text-sm text-neutral-500">
                                    情報バンクから自動でキーワード抽出し、高品質な記事を生成します
                                </p>
                            </div>
                        </div>

                        {/* Required Selections */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            {/* Category Selection */}
                            <div>
                                <Label className="text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                    <FolderOpen size={14} className="text-neutral-500" />
                                    カテゴリー <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="カテゴリーを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span>{cat.name}</span>
                                                    <span className="text-xs text-neutral-400">{cat.articleCount}記事</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Author Selection */}
                            <div>
                                <Label className="text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                    <User size={14} className="text-neutral-500" />
                                    監修者 <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedAuthorId} onValueChange={setSelectedAuthorId}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="監修者を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {authors.map(author => (
                                            <SelectItem key={author.id} value={author.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{author.name}</span>
                                                    <span className="text-xs text-neutral-400">({author.role})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Conversion Selection */}
                            <div>
                                <Label className="text-sm font-bold text-neutral-700 mb-2 flex items-center gap-2">
                                    <Target size={14} className="text-neutral-500" />
                                    コンバージョン <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedConversionId} onValueChange={setSelectedConversionId}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="コンバージョンを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {conversions.map(cv => (
                                            <SelectItem key={cv.id} value={cv.id}>
                                                {cv.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Image Style Selection */}
                        <div className="mb-8">
                            <Label className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
                                <Image size={14} className="text-neutral-500" />
                                画像スタイル
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setImageStyle('WATERCOLOR')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        imageStyle === 'WATERCOLOR'
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                                            imageStyle === 'WATERCOLOR' ? "bg-blue-100" : "bg-neutral-100"
                                        )}>
                                            🎨
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-medium",
                                                imageStyle === 'WATERCOLOR' ? "text-blue-900" : "text-neutral-900"
                                            )}>
                                                手書き風水彩画
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                柔らかな線と淡い色合い
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageStyle('REALISTIC')}
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        imageStyle === 'REALISTIC'
                                            ? "border-violet-500 bg-violet-50"
                                            : "border-neutral-200 hover:border-neutral-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                                            imageStyle === 'REALISTIC' ? "bg-violet-100" : "bg-neutral-100"
                                        )}>
                                            📷
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "font-medium",
                                                imageStyle === 'REALISTIC' ? "text-violet-900" : "text-neutral-900"
                                            )}>
                                                リアルな写真風
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                本格的な写真のような仕上がり
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Selection Summary */}
                        {hasRequiredSelections && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100"
                            >
                                <p className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    選択内容
                                </p>
                                <div className="grid grid-cols-4 gap-4 text-xs text-emerald-700">
                                    <div>
                                        <span className="text-emerald-500">カテゴリー:</span> {selectedCategory?.name}
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">監修者:</span> {selectedAuthor?.name}
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">CV:</span> {selectedConversion?.name}
                                    </div>
                                    <div>
                                        <span className="text-emerald-500">画像:</span> {imageStyle === 'WATERCOLOR' ? '手書き風' : 'リアル'}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Article Count Selector */}
                        <div className="mb-8">
                            <Label className="text-sm font-bold text-neutral-700 mb-3 block">生成する記事数</Label>
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-xl"
                                    onClick={() => setArticleCount(Math.max(1, articleCount - 1))}
                                    disabled={articleCount <= 1}
                                >
                                    <Minus size={18} />
                                </Button>
                                <div className="flex-1 max-w-[120px]">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={maxGeneratable}
                                        value={articleCount}
                                        onChange={(e) => setArticleCount(Math.min(maxGeneratable, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="h-12 text-center text-2xl font-bold"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-12 w-12 rounded-xl"
                                    onClick={() => setArticleCount(Math.min(maxGeneratable, articleCount + 1))}
                                    disabled={articleCount >= maxGeneratable}
                                >
                                    <Plus size={18} />
                                </Button>
                                <span className="text-sm text-neutral-500">/ {maxGeneratable} 件まで</span>
                            </div>
                        </div>

                        {/* Schedule Options */}
                        <div className="mb-8 p-5 bg-neutral-50 rounded-xl border border-neutral-100">
                            <Label className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
                                <CalendarDays size={14} className="text-neutral-500" />
                                公開設定
                            </Label>
                            <Tabs value={scheduleMode} onValueChange={(v) => setScheduleMode(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-4 h-10">
                                    <TabsTrigger value="draft" className="text-xs">下書き保存</TabsTrigger>
                                    <TabsTrigger value="now" className="text-xs">即時公開</TabsTrigger>
                                    <TabsTrigger value="schedule" className="text-xs">予約投稿</TabsTrigger>
                                </TabsList>

                                <TabsContent value="draft" className="mt-0">
                                    <p className="text-xs text-neutral-500">生成後は下書きとして保存されます。公開は手動で行います。</p>
                                </TabsContent>

                                <TabsContent value="now" className="mt-0">
                                    <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                        <Zap size={12} />
                                        <span>生成完了と同時に公開されます</span>
                                    </div>
                                </TabsContent>

                                <TabsContent value="schedule" className="mt-0 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs text-neutral-500 mb-1 block">予約日</Label>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs text-neutral-500 mb-1 block">時間</Label>
                                            <Input
                                                type="time"
                                                value={postTime}
                                                onChange={(e) => setPostTime(e.target.value)}
                                                className="h-9 text-sm"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* What AI will do */}
                        <div className="mb-8 p-5 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
                            <p className="text-sm font-medium mb-3 text-blue-800">
                                AI記事生成の特徴
                            </p>
                            <ul className="space-y-2 text-xs text-blue-700">
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    情報バンクから記事テーマを自動抽出
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    Web検索で最新の信頼性データを取得
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    LLMo最適化（AI検索エンジン対応）
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    モノトーンスタイルで統一されたデザイン
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    選択した監修者の文体で記事を執筆
                                </li>
                            </ul>
                        </div>

                        {/* Generate Button */}
                        <Button
                            size="lg"
                            className="w-full h-14 rounded-2xl text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-200"
                            disabled={!canGenerate || genStatus === 'processing'}
                            onClick={handleGenerate}
                        >
                            {genStatus === 'processing' ? (
                                <>
                                    <Loader2 size={20} className="mr-2 animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                <>
                                    <Play size={20} className="mr-2" />
                                    {articleCount}件の記事を生成する
                                </>
                            )}
                        </Button>

                        {!hasRequiredSelections && (
                            <p className="text-xs text-amber-600 text-center mt-3">
                                カテゴリー・監修者・コンバージョンを選択してください
                            </p>
                        )}
                        {hasRequiredSelections && maxGeneratable === 0 && (
                            <p className="text-xs text-red-500 text-center mt-3">
                                情報バンクにコンテンツがありません
                            </p>
                        )}
                    </div>

                    {/* Category Balance Preview */}
                    {categories.length > 0 && (
                        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-neutral-700 mb-4">カテゴリー別状況</h3>
                            <div className="space-y-3">
                                {categories.slice(0, 6).map(cat => (
                                    <div key={cat.id} className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg transition-colors",
                                        selectedCategoryId === cat.id && "bg-blue-50 border border-blue-200"
                                    )}>
                                        <div className="w-24 text-xs font-medium text-neutral-700 truncate">{cat.name}</div>
                                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    selectedCategoryId === cat.id
                                                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                                        : "bg-gradient-to-r from-neutral-400 to-neutral-500"
                                                )}
                                                style={{ width: `${Math.min(100, (cat.articleCount / Math.max(...categories.map(c => c.articleCount), 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <div className="w-16 text-xs text-neutral-500 text-right">{cat.articleCount}記事</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <GenerationProgressModal
                isOpen={progressModalOpen}
                currentStepIndex={currentStep}
                progress={progress}
                articleCount={articleCount}
                status={genStatus === 'idle' ? 'processing' : genStatus}
                pipelineMode={pipelineMode}
                onCancel={() => {
                    setGenStatus('idle');
                    setProgressModalOpen(false);
                }}
                onComplete={handleComplete}
                onRetry={handleGenerate}
                onSavePartial={handleComplete}
                successCount={Math.floor(articleCount * (progress / 100))}
            />
        </div>
    );
}
