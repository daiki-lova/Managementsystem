import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, UserCheck, ChevronRight, CheckCircle2, Check, Copy, CalendarDays, Globe, Lightbulb, Loader2, Zap } from 'lucide-react';
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
import type { Category, ConversionItem, KnowledgeItem } from '../../types';
import { GenerationProgressModal } from './GenerationProgressModal';

export type GeneratedArticleData = {
    title: string;
    status: 'draft' | 'published' | 'scheduled';
    publishedAt: string;
    category: string; // Include category name for better mock data
};

export function StrategyView({ 
    onGenerate,
    onManageConversions,
    onNavigateToCategories,
    categories = [],
    conversions = [],
    knowledgeItems = []
}: { 
    onGenerate: (articles: GeneratedArticleData[]) => void;
    onManageConversions?: () => void;
    onNavigateToCategories?: () => void;
    categories?: Category[];
    conversions?: ConversionItem[];
    knowledgeItems?: KnowledgeItem[];
}) {
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
    const [selectedConversionIds, setSelectedConversionIds] = useState<Set<string>>(new Set());
    const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<Set<string>>(new Set());
    
    // Modal State
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [genStatus, setGenStatus] = useState<'idle' | 'processing' | 'error' | 'completed'>('idle');
    const [generatedResult, setGeneratedResult] = useState<GeneratedArticleData[]>([]);
    
    // Options
    const [generateCount, setGenerateCount] = useState(1);
    const [scheduleMode, setScheduleMode] = useState<'draft' | 'now' | 'schedule'>('draft');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [postTime, setPostTime] = useState('10:00');

    const toggleCategory = (id: string) => {
        const newSet = new Set(selectedCategoryIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedCategoryIds(newSet);
    };

    const toggleConversion = (id: string) => {
        const newSet = new Set(selectedConversionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedConversionIds(newSet);
    };

    const toggleKnowledge = (id: string) => {
        const newSet = new Set(selectedKnowledgeIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedKnowledgeIds(newSet);
    };

    const totalTasks = selectedCategoryIds.size * selectedConversionIds.size * generateCount;
    
    const selectedCategoriesList = categories.filter(c => selectedCategoryIds.has(c.id));
    const selectedConversionsList = conversions.filter(c => selectedConversionIds.has(c.id));

    const handleGenerate = () => {
        if (totalTasks === 0) return;
        
        setProgressModalOpen(true);
        setGenStatus('processing');
        setCurrentStep(0);
        setProgress(0);
        
        // Create tasks for all combinations
        const tasks: { catId: string, cvId: string, index: number }[] = [];
        selectedCategoryIds.forEach(catId => {
            selectedConversionIds.forEach(cvId => {
                for (let i = 0; i < generateCount; i++) {
                    tasks.push({ catId, cvId, index: i });
                }
            });
        });

        // Simulate bulk generation with steps
        let step = 0;
        let prog = 0;
        const interval = setInterval(() => {
            prog += 1; // Slower
            if (prog > 100) prog = 100;
            
            // Map progress to steps
            if (prog < 15) step = 0;
            else if (prog < 30) step = 1;
            else if (prog < 55) step = 2;
            else if (prog < 75) step = 3;
            else if (prog < 90) step = 4;
            else step = 5;

            setCurrentStep(step);
            setProgress(prog);

            if (prog >= 100) {
                clearInterval(interval);
                
                const generatedArticles: GeneratedArticleData[] = [];

                tasks.forEach((task, globalIndex) => {
                    const category = categories.find(c => c.id === task.catId);
                    const conversion = conversions.find(c => c.id === task.cvId);
                    
                    let title = `[${category?.name}] ${conversion?.name}`;
                    if (generateCount > 1) {
                        title += ` (案${task.index + 1})`;
                    }
                    
                    // Determine Status and PublishedAt
                    let status: 'draft' | 'published' | 'scheduled' = 'draft';
                    let publishedAt = '-';

                    if (scheduleMode === 'schedule') {
                        status = 'scheduled';
                        publishedAt = `${startDate} ${postTime}`;
                        const dateStr = new Date(startDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
                        title += ` [${dateStr} ${postTime} 公開予約]`; 
                    } else if (scheduleMode === 'now') {
                        status = 'published';
                        const now = new Date();
                        publishedAt = now.toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-');
                        const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                        title += ` [${timeStr} 公開済み]`;
                    } else {
                        status = 'draft';
                        title += ` [下書き]`;
                    }
                    
                    generatedArticles.push({
                        title,
                        status,
                        publishedAt,
                        category: category?.name || '未分類'
                    });
                });

                setGeneratedResult(generatedArticles);
                setGenStatus('completed');
            }
        }, 50); 
    };

    const handleComplete = () => {
        onGenerate(generatedResult);
        setProgressModalOpen(false);
    };

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
                            {categories.length === 0 && (
                                <div className="text-center py-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                    <p className="text-xs text-neutral-500">カテゴリーが登録されていません。</p>
                                </div>
                            )}
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
                            {conversions.length === 0 && (
                                <div className="text-center py-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                    <p className="text-xs text-neutral-500">コンバージョンが登録されていません。</p>
                                </div>
                            )}
                        </section>

                        {/* Step 3: Knowledge Bank */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">3</span>
                                    <h2 className="text-sm font-bold text-neutral-900">関連情報</h2>
                                </div>
                                <div className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                                    {selectedKnowledgeIds.size} 選択中
                                </div>
                            </div>

                            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 space-y-3">
                                {knowledgeItems.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-xs text-neutral-500 mb-2">情報がまだ登録されていません</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {knowledgeItems.map((item) => {
                                            const isSelected = selectedKnowledgeIds.has(item.id);
                                            // Mock relevance score
                                            const relevance = item.id === 'k1' ? 0.92 : 0.88;
                                            
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => genStatus !== 'processing' && toggleKnowledge(item.id)}
                                                    disabled={genStatus === 'processing'}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-left transition-all flex items-start gap-3 group hover:shadow-sm",
                                                        isSelected
                                                            ? "border-blue-200 bg-blue-50/30 ring-1 ring-blue-100" 
                                                            : "border-neutral-200 bg-white hover:border-neutral-300"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                        isSelected ? "bg-blue-600 border-blue-600" : "border-neutral-300 bg-white"
                                                    )}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-neutral-800 line-clamp-2 mb-1.5 leading-relaxed">
                                                            {item.content}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                                                            <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                                                                {item.brand === 'ALL' ? '共通' : item.brand}
                                                            </span>
                                                            {item.course && (
                                                                <span className="px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200">
                                                                    {item.course}
                                                                </span>
                                                            )}
                                                            <span className="ml-auto font-medium text-green-600 flex items-center gap-0.5">
                                                                <Zap size={10} /> 関連度 {relevance}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Column: Settings & Action (Fixed Width) */}
                <div className="w-[360px] flex flex-col border-l border-neutral-100 bg-neutral-50/50 relative overflow-hidden">
                    
                    <div className={cn("p-6 space-y-6 flex-1 overflow-y-auto transition-opacity duration-300", genStatus === 'processing' ? "opacity-30 pointer-events-none" : "opacity-100")}>
                        <div className="flex items-center gap-2 mb-2">
                             <span className="flex items-center justify-center w-5 h-5 rounded-full bg-neutral-900 text-white font-bold text-[10px]">4</span>
                             <h2 className="text-sm font-bold text-neutral-900">生成オプション</h2>
                        </div>

                        {/* Volume */}
                        <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3 shadow-sm">
                            <Label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                                <Copy size={12} className="text-blue-500" />
                                生成数 (1セットあたり)
                            </Label>
                            <Select 
                                value={String(generateCount)} 
                                onValueChange={(v) => setGenerateCount(Number(v))}
                            >
                                <SelectTrigger className="bg-neutral-50 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1記事</SelectItem>
                                    <SelectItem value="2">2記事</SelectItem>
                                    <SelectItem value="3">3記事</SelectItem>
                                    <SelectItem value="4">4記事</SelectItem>
                                    <SelectItem value="5">5記事</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-neutral-500 leading-tight">
                                キーワード・テーマはAIがトレンドから自動分析
                            </p>
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
                        <div className="flex items-center justify-between mb-4 text-xs">
                            <span className="text-neutral-500">生成対象</span>
                            <span className="font-bold text-neutral-900 text-base">{totalTasks} <span className="text-xs font-normal text-neutral-500">記事</span></span>
                        </div>
                        
                        <Button 
                            size="lg" 
                            className="w-full rounded-full h-12 text-sm font-bold shadow-lg shadow-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800"
                            disabled={totalTasks === 0 || genStatus === 'processing'}
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
                articleCount={totalTasks}
                status={genStatus === 'idle' ? 'processing' : genStatus}
                onCancel={() => {
                    setGenStatus('idle'); // or error logic
                    setProgressModalOpen(false);
                }}
                onComplete={handleComplete}
                onRetry={handleGenerate}
                onSavePartial={handleComplete} // Simplified for demo
                successCount={Math.floor(totalTasks * (progress / 100))} // Mock success count
            />
        </div>
    );
}