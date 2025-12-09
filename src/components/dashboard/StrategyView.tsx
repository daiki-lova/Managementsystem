'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, UserCheck, ChevronRight, CheckCircle2, Check, Copy, CalendarDays, Globe, Lightbulb, Loader2, Zap, User, Search, RefreshCw, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Category, ConversionItem, KnowledgeItem, Profile } from '../../types';
import { GenerationProgressModal } from './GenerationProgressModal';
import {
    useCategories,
    useAuthors,
    useConversions,
    useKnowledgeBank,
    useCreateGenerationJob,
    useGenerationJobs,
} from '../../lib/hooks';

export type GeneratedArticleData = {
    title: string;
    status: 'draft' | 'published' | 'scheduled';
    publishedAt: string;
    category: string;
    author?: string;
};

type KeywordCandidate = {
    id: string;
    keyword: string;
    volume: number;
    difficulty: number;
};

const MOCK_KEYWORDS: KeywordCandidate[] = [
    { id: 'kw1', keyword: '体が硬い ヨガ', volume: 1200, difficulty: 45 },
    { id: 'kw2', keyword: 'ヨガ 初心者 始め方', volume: 980, difficulty: 38 },
    { id: 'kw3', keyword: 'ヨガ 効果 いつから', volume: 720, difficulty: 52 },
    { id: 'kw4', keyword: '自宅 ヨガ マットなし', volume: 540, difficulty: 30 },
    { id: 'kw5', keyword: '寝る前 ヨガ ポーズ', volume: 880, difficulty: 42 },
    { id: 'kw6', keyword: '朝ヨガ 5分', volume: 650, difficulty: 35 },
];

export function StrategyView({
    onGenerate,
    onManageConversions,
    onNavigateToCategories,
}: {
    onGenerate: (articles: GeneratedArticleData[]) => void;
    onManageConversions?: () => void;
    onNavigateToCategories?: () => void;
}) {
    // API Data fetching
    const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
    const { data: authorsData, isLoading: authorsLoading } = useAuthors();
    const { data: conversionsData, isLoading: conversionsLoading } = useConversions();
    const { data: knowledgeData } = useKnowledgeBank();

    // Map API data to component format
    const categories: Category[] = (categoriesData?.data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        supervisorId: cat.authorId,
        supervisorName: cat.author?.name,
    }));

    const authors: Profile[] = (authorsData?.data || []).map((author: any) => ({
        id: author.id,
        name: author.name,
        email: author.email || '',
        role: author.title || author.role || '監修者',
        avatar: author.imageUrl,
    }));

    const conversions: ConversionItem[] = (conversionsData?.data || []).map((cv: any) => ({
        id: cv.id,
        name: cv.name,
        description: cv.description,
        url: cv.url,
        type: cv.type,
    }));

    const knowledgeItems: KnowledgeItem[] = (knowledgeData?.data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        source: item.sourceUrl,
        kind: item.kind,
    }));

    // Generation job mutation
    const createGenerationJob = useCreateGenerationJob();

    // Selection state
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
    const [selectedConversionIds, setSelectedConversionIds] = useState<Set<string>>(new Set());
    const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

    // Keyword State
    const [showKeywords, setShowKeywords] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedKeywordIds, setSelectedKeywordIds] = useState<Set<string>>(new Set());
    const [keywordCandidates, setKeywordCandidates] = useState<KeywordCandidate[]>([]);
    const [customKeyword, setCustomKeyword] = useState('');
    const [customKeywords, setCustomKeywords] = useState<KeywordCandidate[]>([]);

    // Modal State
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [genStatus, setGenStatus] = useState<'idle' | 'processing' | 'error' | 'completed'>('idle');
    const [generatedResult, setGeneratedResult] = useState<GeneratedArticleData[]>([]);
    const [activeJobIds, setActiveJobIds] = useState<string[]>([]);

    // Options
    const [scheduleMode, setScheduleMode] = useState<'draft' | 'now' | 'schedule'>('draft');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [postTime, setPostTime] = useState('10:00');

    // Loading state
    const isDataLoading = categoriesLoading || authorsLoading || conversionsLoading;

    const toggleCategory = (id: string) => {
        const newSet = new Set(selectedCategoryIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedCategoryIds(newSet);
        // Reset keywords if category changes
        setShowKeywords(false);
        setSelectedKeywordIds(new Set());
        setCustomKeywords([]);
    };

    const toggleConversion = (id: string) => {
        const newSet = new Set(selectedConversionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedConversionIds(newSet);
    };

    const toggleKeyword = (id: string) => {
        const newSet = new Set(selectedKeywordIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            // Limit total selection (suggested + custom) to 5
            if (newSet.size >= 5) return;
            newSet.add(id);
        }
        setSelectedKeywordIds(newSet);
    };
    
    const addCustomKeyword = () => {
        if (!customKeyword.trim()) return;
        
        const newId = `custom-${Date.now()}`;
        const newKw: KeywordCandidate = {
            id: newId,
            keyword: customKeyword,
            volume: 0, // Unknown for custom
            difficulty: 0
        };
        
        setCustomKeywords([...customKeywords, newKw]);
        setCustomKeyword('');
        
        // Auto select the newly added custom keyword if under limit
        if (selectedKeywordIds.size < 5) {
            const newSet = new Set(selectedKeywordIds);
            newSet.add(newId);
            setSelectedKeywordIds(newSet);
        }
    };
    
    const removeCustomKeyword = (id: string) => {
        setCustomKeywords(customKeywords.filter(k => k.id !== id));
        const newSet = new Set(selectedKeywordIds);
        newSet.delete(id);
        setSelectedKeywordIds(newSet);
    };

    const isStep123Complete = selectedCategoryIds.size > 0 && selectedConversionIds.size > 0 && selectedAuthorId !== null;
    const allKeywords = [...keywordCandidates, ...customKeywords];
    const selectedKeywordsList = allKeywords.filter(k => selectedKeywordIds.has(k.id));
    const selectedAuthor = authors.find(a => a.id === selectedAuthorId);

    const handleAnalyzeKeywords = () => {
        setIsAnalyzing(true);
        // Simulate API call
        setTimeout(() => {
            setKeywordCandidates(MOCK_KEYWORDS);
            setShowKeywords(true);
            setIsAnalyzing(false);
        }, 1500);
    };

    const handleGenerate = async () => {
        if (selectedKeywordsList.length === 0) return;

        setProgressModalOpen(true);
        setGenStatus('processing');
        setCurrentStep(0);
        setProgress(0);
        setActiveJobIds([]);

        // Get selected category ID (first one)
        const categoryId = Array.from(selectedCategoryIds)[0];
        // Get selected conversion ID (first one)
        const conversionId = Array.from(selectedConversionIds)[0];
        // Get relevant knowledge IDs
        const knowledgeIds = knowledgeItems.slice(0, 5).map(k => k.id);

        try {
            // Create generation jobs for each keyword
            const jobPromises = selectedKeywordsList.map(keyword =>
                createGenerationJob.mutateAsync({
                    keyword: keyword.keyword,
                    categoryId,
                    authorId: selectedAuthorId || undefined,
                    conversionId,
                    knowledgeIds,
                    generateImages: true,
                })
            );

            const results = await Promise.all(jobPromises);
            const jobIds = results.map(r => r.id);
            setActiveJobIds(jobIds);

            // Start polling for job status
            pollJobStatus(jobIds);
        } catch (error) {
            console.error('Failed to create generation jobs:', error);
            setGenStatus('error');
        }
    };

    // Poll job status
    const pollJobStatus = (jobIds: string[]) => {
        let completedCount = 0;
        const totalJobs = jobIds.length;

        const checkStatus = async () => {
            try {
                // In a real implementation, we would fetch job status from API
                // For now, simulate progress with timeout
                completedCount++;
                const progressPercent = Math.min(100, Math.floor((completedCount / totalJobs) * 100));

                // Map progress to steps
                let step = 0;
                if (progressPercent < 15) step = 0;
                else if (progressPercent < 30) step = 1;
                else if (progressPercent < 55) step = 2;
                else if (progressPercent < 75) step = 3;
                else if (progressPercent < 90) step = 4;
                else step = 5;

                setCurrentStep(step);
                setProgress(progressPercent);

                if (progressPercent >= 100) {
                    // All jobs completed
                    const category = categories.find(c => selectedCategoryIds.has(c.id));
                    const generatedArticles: GeneratedArticleData[] = selectedKeywordsList.map(keyword => {
                        let title = keyword.keyword;
                        let status: 'draft' | 'published' | 'scheduled' = 'draft';
                        let publishedAt = '-';

                        if (scheduleMode === 'schedule') {
                            status = 'scheduled';
                            publishedAt = `${startDate} ${postTime}`;
                        } else if (scheduleMode === 'now') {
                            status = 'published';
                            publishedAt = new Date().toISOString();
                        }

                        return {
                            title,
                            status,
                            publishedAt,
                            category: category?.name || '未分類',
                            author: selectedAuthor?.name || 'AI Assistant'
                        };
                    });

                    setGeneratedResult(generatedArticles);
                    setGenStatus('completed');
                } else {
                    // Continue polling
                    setTimeout(checkStatus, 2000);
                }
            } catch (error) {
                console.error('Error checking job status:', error);
                setGenStatus('error');
            }
        };

        // Start initial check after delay
        setTimeout(checkStatus, 2000);
    };

    const handleComplete = () => {
        onGenerate(generatedResult);
        setProgressModalOpen(false);
    };

    // Loading state
    if (isDataLoading) {
        return (
            <div className="flex flex-col h-full bg-white p-6">
                <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900">AI記事企画</h1>
                        <p className="text-sm text-neutral-500 font-medium">カテゴリーとコンバージョンを選択して記事構成を一括生成</p>
                    </div>
                </header>
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
        <div className="flex flex-col h-full bg-white p-6">
             {/* Header - Consistent with CategoriesView/PostsView */}
             <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">AI記事企画</h1>
                    <p className="text-sm text-neutral-500 font-medium">カテゴリーとコンバージョンを選択して記事構成を一括生成</p>
                </div>
            </header>

            <div className="flex-1 min-h-0 bg-white flex overflow-hidden relative">
                {/* Left Column: Selection Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl space-y-8">
                        
                        {/* Step 1: Category */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">1</span>
                                    <h2 className="text-sm font-bold text-neutral-900">カテゴリー</h2>
                                </div>
                                <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                    {selectedCategoryIds.size} 選択中
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {categories.map(cat => {
                                    const isSelected = selectedCategoryIds.has(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => genStatus !== 'processing' && toggleCategory(cat.id)}
                                            disabled={genStatus === 'processing'}
                                            className={cn(
                                                "relative p-3 rounded-lg border text-left transition-all group flex items-center justify-between",
                                                isSelected
                                                    ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" 
                                                    : "border-neutral-100 bg-white hover:border-neutral-300"
                                            )}
                                        >
                                            <div className="min-w-0 flex-1 mr-2">
                                                <h3 className={cn("font-bold text-xs mb-0.5 truncate", isSelected ? "text-neutral-900" : "text-neutral-900")}>{cat.name}</h3>
                                                <div className="flex items-center gap-1 text-[10px] text-neutral-500 truncate">
                                                    <UserCheck size={10} />
                                                    <span>{cat.supervisorName || '未設定'}</span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="bg-neutral-900 text-white rounded-full p-0.5 shrink-0">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Step 2: CV */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">2</span>
                                    <h2 className="text-sm font-bold text-neutral-900">コンバージョン</h2>
                                </div>
                                <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                    {selectedConversionIds.size} 選択中
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {conversions.map((cv) => {
                                    const isSelected = selectedConversionIds.has(cv.id);
                                    return (
                                        <button
                                            key={cv.id}
                                            onClick={() => genStatus !== 'processing' && toggleConversion(cv.id)}
                                            disabled={genStatus === 'processing'}
                                            className={cn(
                                                "px-3 py-2.5 rounded-lg border text-xs font-bold transition-all text-left flex items-center justify-between",
                                                isSelected
                                                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm shadow-neutral-200"
                                                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                            )}
                                        >
                                            <span className="truncate mr-2">{cv.name}</span>
                                            {isSelected && <CheckCircle2 size={12} className="shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Step 3: Supervisor */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">3</span>
                                    <h2 className="text-sm font-bold text-neutral-900">監修者</h2>
                                </div>
                                {selectedAuthorId && (
                                     <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                        選択済み
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                {authors.map((author) => {
                                    const isSelected = selectedAuthorId === author.id;
                                    return (
                                        <button
                                            key={author.id}
                                            onClick={() => genStatus !== 'processing' && setSelectedAuthorId(isSelected ? null : author.id)}
                                            disabled={genStatus === 'processing'}
                                            className={cn(
                                                "p-2 rounded-lg border text-left transition-all flex items-center gap-3 group",
                                                isSelected
                                                    ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" 
                                                    : "border-neutral-200 bg-white hover:border-neutral-300"
                                            )}
                                        >
                                            <Avatar className="h-8 w-8 border border-neutral-100">
                                                <AvatarImage src={author.avatar} alt={author.name} />
                                                <AvatarFallback className="text-[10px] bg-neutral-100 text-neutral-500">
                                                    {author.name.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className={cn("font-bold text-xs truncate", isSelected ? "text-neutral-900" : "text-neutral-700")}>
                                                    {author.name}
                                                </h3>
                                                <p className="text-[10px] text-neutral-500 truncate">{author.role}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="bg-neutral-900 text-white rounded-full p-0.5 shrink-0">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                        
                        {/* Keyword Selection Action */}
                        <AnimatePresence mode="wait">
                            {!showKeywords && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="py-4"
                                >
                                    <Button 
                                        variant="outline"
                                        className="w-full h-16 border-dashed border-2 text-neutral-500 hover:text-neutral-900 hover:border-neutral-900 hover:bg-neutral-50 transition-all group"
                                        disabled={!isStep123Complete || isAnalyzing}
                                        onClick={handleAnalyzeKeywords}
                                    >
                                        {isAnalyzing ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="animate-spin" size={18} />
                                                <span>トレンドを分析中...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="flex items-center gap-2 font-bold">
                                                    <Search size={16} />
                                                    キーワードを選定する
                                                </span>
                                                <span className="text-xs font-normal opacity-70">
                                                    {isStep123Complete ? 'カテゴリーと監修者から最適なキーワードを分析します' : '先にカテゴリー・CV・監修者を選択してください'}
                                                </span>
                                            </div>
                                        )}
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 4: Keywords (After Selection) */}
                            {showKeywords && (
                                <motion.section 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">4</span>
                                            <h2 className="text-sm font-bold text-neutral-900">キーワード設定</h2>
                                        </div>
                                        <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                            {selectedKeywordIds.size} / 5 選択中
                                        </div>
                                    </div>

                                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-4">
                                        {/* Custom Keyword Input */}
                                        <div className="flex gap-2">
                                            <Input 
                                                placeholder="狙いたいキーワードを入力..." 
                                                className="h-9 text-xs bg-white"
                                                value={customKeyword}
                                                onChange={(e) => setCustomKeyword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && addCustomKeyword()}
                                            />
                                            <Button 
                                                size="sm" 
                                                onClick={addCustomKeyword}
                                                disabled={!customKeyword.trim() || selectedKeywordIds.size >= 5}
                                                className="h-9 bg-neutral-900 text-white hover:bg-neutral-800"
                                            >
                                                追加
                                            </Button>
                                        </div>

                                        {/* Custom Keywords List */}
                                        {customKeywords.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-neutral-500">手動入力</Label>
                                                <div className="space-y-2">
                                                    {customKeywords.map((kw) => {
                                                        const isSelected = selectedKeywordIds.has(kw.id);
                                                        return (
                                                            <div key={kw.id} className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => toggleKeyword(kw.id)}
                                                                    className={cn(
                                                                        "flex-1 p-3 rounded-lg border text-left transition-all flex items-center gap-3 bg-white hover:border-neutral-300",
                                                                        isSelected
                                                                            ? "border-neutral-900 ring-1 ring-neutral-900 z-10" 
                                                                            : "border-neutral-200"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                                        isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                                                    )}>
                                                                        {isSelected && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-neutral-900">{kw.keyword}</span>
                                                                </button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeCustomKeyword(kw.id)}
                                                                    className="h-8 w-8 text-neutral-400 hover:text-red-500"
                                                                >
                                                                    <X size={14} />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggested Keywords List */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-neutral-500">AIおすすめ</Label>
                                            <div className="space-y-2">
                                                {keywordCandidates.map((kw) => {
                                                    const isSelected = selectedKeywordIds.has(kw.id);
                                                    const isDisabled = !isSelected && selectedKeywordIds.size >= 5;
                                                    
                                                    return (
                                                        <button
                                                            key={kw.id}
                                                            onClick={() => toggleKeyword(kw.id)}
                                                            disabled={isDisabled}
                                                            className={cn(
                                                                "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 bg-white hover:border-neutral-300",
                                                                isSelected
                                                                    ? "border-neutral-900 ring-1 ring-neutral-900 z-10" 
                                                                    : "border-neutral-200",
                                                                isDisabled && "opacity-50 cursor-not-allowed hover:border-neutral-200"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                                isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300"
                                                            )}>
                                                                {isSelected && <Check size={10} className="text-white" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-neutral-900 mb-0.5">
                                                                    {kw.keyword}
                                                                </p>
                                                                <p className="text-[10px] text-neutral-500 flex items-center gap-3">
                                                                    <span>月間検索 {kw.volume.toLocaleString()}</span>
                                                                    <span className="w-px h-2 bg-neutral-300" />
                                                                    <span>難易度 {kw.difficulty}</span>
                                                                </p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-center pt-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={handleAnalyzeKeywords}
                                                className="text-xs text-neutral-500 hover:text-neutral-900 h-8"
                                            >
                                                <RefreshCw size={12} className="mr-1.5" />
                                                おすすめを再取得
                                            </Button>
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Settings & Action (Fixed Width) */}
                <div className="w-[360px] flex flex-col border-l border-neutral-100 bg-neutral-50/50 relative overflow-hidden">
                    
                    <div className={cn("p-6 space-y-6 flex-1 overflow-y-auto transition-opacity duration-300", genStatus === 'processing' ? "opacity-30 pointer-events-none" : "opacity-100")}>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">5</span>
                             <h2 className="text-sm font-bold text-neutral-900">生成オプション</h2>
                        </div>

                        {/* Schedule */}
                        <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4 shadow-sm">
                            <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                                <CalendarDays size={12} className="text-green-600" />
                                公開設定
                            </Label>
                            
                            <Tabs 
                                value={scheduleMode} 
                                onValueChange={(v) => setScheduleMode(v as 'draft' | 'now' | 'schedule')}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-3 mb-3 p-1 bg-neutral-100 h-8">
                                    <TabsTrigger value="draft" className="text-[10px] h-6 px-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        下書き
                                    </TabsTrigger>
                                    <TabsTrigger value="now" className="text-[10px] h-6 px-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        即時公開
                                    </TabsTrigger>
                                    <TabsTrigger value="schedule" className="text-[10px] h-6 px-1 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        予約投稿
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="draft" className="mt-0">
                                    <p className="text-[10px] text-neutral-500 bg-neutral-50 p-2 rounded border border-neutral-100">
                                        「下書き」として保存します。公開は手動で行います。
                                    </p>
                                </TabsContent>

                                <TabsContent value="now" className="mt-0">
                                    <div className="bg-amber-50 p-2 rounded border border-amber-100 text-[10px] text-amber-700 flex items-start gap-2">
                                        <Zap size={12} className="shrink-0 mt-0.5" />
                                        <span>
                                            生成完了と同時に<strong>公開状態</strong>になります。
                                        </span>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="schedule" className="mt-0 space-y-3">
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="start-date" className="text-[10px] font-medium text-neutral-600">予約日 (一括指定)</Label>
                                            <Input 
                                                id="start-date" 
                                                type="date" 
                                                className="bg-neutral-50 h-8 text-xs"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="post-time" className="text-[10px] font-medium text-neutral-600">投稿時間</Label>
                                            <Input 
                                                id="post-time" 
                                                type="time" 
                                                className="bg-neutral-50 h-8 text-xs"
                                                value={postTime}
                                                onChange={(e) => setPostTime(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                                            <Globe size={10} />
                                            全記事を指定日時に予約します
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Footer / Generate Action */}
                    <div className={cn("p-6 bg-white border-t border-neutral-200 transition-opacity duration-300", genStatus === 'processing' ? "opacity-30 pointer-events-none" : "opacity-100")}>
                        <div className="flex items-start justify-between mb-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                            <span className="text-xs font-bold text-neutral-500 mt-0.5">生成対象</span>
                            {selectedKeywordsList.length > 0 ? (
                                <div className="text-right max-w-[200px]">
                                    <div className="flex flex-col gap-0.5 mb-1">
                                        {selectedKeywordsList.slice(0, 2).map(k => (
                                            <p key={k.id} className="text-sm font-bold text-neutral-900 line-clamp-1">
                                                「{k.keyword}」
                                            </p>
                                        ))}
                                        {selectedKeywordsList.length > 2 && (
                                            <p className="text-xs text-neutral-400 text-right">
                                                他 {selectedKeywordsList.length - 2} 件
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-1 pt-1 border-t border-neutral-200 inline-block w-full">
                                        計 {selectedKeywordsList.length} 記事
                                    </p>
                                </div>
                            ) : (
                                <span className="text-xs text-neutral-400">キーワード未選択</span>
                            )}
                        </div>
                        
                        <Button 
                            size="lg" 
                            className="w-full rounded-full h-12 text-sm font-bold shadow-lg shadow-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
                            disabled={selectedKeywordsList.length === 0 || genStatus === 'processing'}
                            onClick={handleGenerate}
                        >
                            <Sparkles className="mr-2" size={16} />
                            一括生成を開始する
                        </Button>
                    </div>
                </div>
            </div>
            
            <GenerationProgressModal
                isOpen={progressModalOpen}
                currentStepIndex={currentStep}
                progress={progress}
                articleCount={1}
                status={genStatus === 'idle' ? 'processing' : genStatus}
                onCancel={() => {
                    setGenStatus('idle'); // or error logic
                    setProgressModalOpen(false);
                }}
                onComplete={handleComplete}
                onRetry={handleGenerate}
                onSavePartial={handleComplete} // Simplified for demo
                successCount={Math.floor(1 * (progress / 100))} // Mock success count
            />
        </div>
    );
}