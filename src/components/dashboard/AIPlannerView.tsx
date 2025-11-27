import React, { useState, useMemo } from 'react';
import { 
    RefreshCw, Plus, Check, ArrowRight, 
    FileText, SlidersHorizontal, ChevronDown,
    ArrowUpDown, ArrowUp, ArrowDown, Sparkles,
    Search, Loader2, BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';

interface Plan {
    id: string;
    keyword: string;
    vol: number;
    status: 'initial' | 'analyzing' | 'planned' | 'created';
    title?: string;
    promptName?: string;
    supervisor?: string;
    reason?: string;
    estWordCount?: number;
    cvAffinity?: 'High' | 'Medium' | 'Low';
}

// Initial data - only keywords and volumes
const INITIAL_KEYWORDS: Plan[] = [
    { id: 'p1', keyword: 'ヨガ 呼吸法 自律神経', vol: 5400, status: 'initial' },
    { id: 'p2', keyword: 'ピラティス マシン 初心者', vol: 12000, status: 'initial' },
    { id: 'p3', keyword: 'ヨガマット おすすめ 厚さ', vol: 8900, status: 'initial' },
    { id: 'p4', keyword: '瞑想 効果 科学的根拠', vol: 3200, status: 'initial' },
    { id: 'p5', keyword: 'ホットヨガ 服装', vol: 15000, status: 'initial' },
    { id: 'p6', keyword: 'ヨガ 前屈 できない', vol: 2100, status: 'initial' },
    { id: 'p7', keyword: '産後ダイエット いつから', vol: 6800, status: 'initial' },
];

// Mock results to be filled after analysis
const MOCK_RESULTS: Record<string, Partial<Plan>> = {
    'p1': {
        title: '自律神経を整える「ヨガ呼吸法」3つの基本ステップ',
        promptName: '専門家記事 (Dr.監修)',
        supervisor: 'Mika',
        reason: '検索流入増が見込めるが、競合の医学的根拠が薄いためチャンス。',
        estWordCount: 4500,
        cvAffinity: 'High'
    },
    'p2': {
        title: 'マシンピラティスは初心者こそやるべき！マットとの違いと効果',
        promptName: 'トレンド紹介',
        supervisor: 'Kenji',
        reason: 'トレンド急上昇中。',
        estWordCount: 3200,
        cvAffinity: 'High'
    },
    'p3': {
        title: '【2025年版】ヨガマットの厚さはどう選ぶ？目的別おすすめ7選',
        promptName: 'リライト (最新版)',
        supervisor: 'Admin',
        reason: '既存記事（2022年）の情報更新が必要。',
        estWordCount: 6000,
        cvAffinity: 'Medium'
    },
    'p4': {
        title: '瞑想の科学的効果とは？脳科学から見たストレス低減メカニズム',
        promptName: '論文解説',
        supervisor: 'Dr. S',
        reason: 'エビデンス重視の層へアプローチ',
        estWordCount: 5500,
        cvAffinity: 'Low'
    },
    'p5': {
        title: 'ホットヨガの服装選び！失敗しない素材とおすすめコーデ',
        promptName: '初心者ガイド',
        supervisor: 'Mika',
        reason: '初心者の参入障壁を下げる記事が必要',
        estWordCount: 2800,
        cvAffinity: 'Medium'
    },
    'p6': {
        title: '前屈ができない原因は腰？ハムストリング？自宅でできる改善ストレッチ',
        promptName: 'ハウツー解説',
        supervisor: 'Kenji',
        reason: '具体的な悩み解決記事としてCV率が高いキーワード',
        estWordCount: 3500,
        cvAffinity: 'High'
    },
    'p7': {
        title: '産後ダイエットはいつからOK？助産師が教える正しい時期と注意点',
        promptName: '専門家記事',
        supervisor: 'Mika',
        reason: 'YMYL領域のため、信頼性を担保した記事構成が必要',
        estWordCount: 8000,
        cvAffinity: 'Medium'
    }
};

type SortKey = 'keyword' | 'vol' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

export function AIPlannerView({ 
    onGenerate,
    onManageConversions
}: { 
    onGenerate: (id: string, title: string) => void;
    onManageConversions?: () => void;
}) {
    const [viewState, setViewState] = useState<'config' | 'analyzing' | 'results'>('config');
    const [config, setConfig] = useState<{
        cvIds: string[];
        metrics: string[];
        keywords: string;
        volumeRange: [number, number];
    }>({
        cvIds: ['cv1'],
        metrics: ['volume', 'competition'],
        keywords: '',
        volumeRange: [1000, 50000]
    });

    // Mock CV Parts Data
    const CV_PARTS = [
        { 
            id: 'cv1', 
            name: 'スタジオ体験予約LP', 
            description: '30代女性ターゲット、初心者向けキャンペーン訴求',
            type: 'Landing Page'
        },
        { 
            id: 'cv2', 
            name: 'オンラインレッスン無料体験', 
            description: '自宅でできる手軽さを強調、忙しい主婦層向け',
            type: 'Form'
        },
        { 
            id: 'cv3', 
            name: 'オリジナルヨガマット物販', 
            description: '高品質・サステナブル素材を訴求するEC誘導',
            type: 'Product Page'
        }
    ];

    // Initial data should be empty if we are starting from config
    const [plans, setPlans] = useState<Plan[]>([]); 

    const startAnalysis = async () => {
        if (config.cvIds.length === 0) return;
        setViewState('analyzing');
        
        // Simulate API analysis delay
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Set the results which are "already analyzed" as per user request
        // In a real app, this would come from the backend based on the config
        const generatedPlans = INITIAL_KEYWORDS.map(k => ({
            ...k,
            ...MOCK_RESULTS[k.id],
            status: 'planned' as const
        }));
        
        setPlans(generatedPlans);
        setViewState('results');
    };

    const toggleCv = (id: string) => {
        setConfig(prev => {
            const newIds = prev.cvIds.includes(id)
                ? prev.cvIds.filter(cvId => cvId !== id)
                : [...prev.cvIds, id];
            return { ...prev, cvIds: newIds };
        });
    };

    const selectedCvs = CV_PARTS.filter(cv => config.cvIds.includes(cv.id));

    const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());

    const handleTogglePlan = (id: string) => {
        const newSelected = new Set(selectedPlanIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPlanIds(newSelected);
    };

    const handleToggleAllPlans = () => {
        if (selectedPlanIds.size === plans.length) {
            setSelectedPlanIds(new Set());
        } else {
            setSelectedPlanIds(new Set(plans.map(p => p.id)));
        }
    };

    const handleBatchGenerate = () => {
        if (selectedPlanIds.size === 0) return;
        // Call onGenerate for the first selected plan as a demo
        // In a real app, this would likely trigger a batch process
        const firstId = Array.from(selectedPlanIds)[0];
        const plan = plans.find(p => p.id === firstId);
        if (plan && plan.title) {
            onGenerate(plan.id, plan.title);
        }
    };

    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'vol', direction: 'desc' });

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedPlans = useMemo(() => {
        return [...plans].sort((a, b) => {
            const { key, direction } = sortConfig;
            let comparison = 0;

            if (key === 'vol') {
                comparison = a.vol - b.vol;
            } else {
                const valA = a[key] || '';
                const valB = b[key] || '';
                comparison = String(valA).localeCompare(String(valB));
            }

            return direction === 'asc' ? comparison : -comparison;
        });
    }, [plans, sortConfig]);

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ArrowUpDown size={12} className="ml-1 text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        }
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={12} className="ml-1 text-neutral-900" />
            : <ArrowDown size={12} className="ml-1 text-neutral-900" />;
    };

    if (viewState === 'config') {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center p-8">
                <div className="w-full max-w-5xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center space-y-3 mb-12">
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">AI記事企画アシスタント</h1>
                        <p className="text-neutral-500 text-base">ターゲットを選択し、市場分析条件を設定してください</p>
                    </div>

                    <div className="grid grid-cols-12 gap-12 items-start">
                        {/* Left Column: Target CV */}
                        <div className="col-span-7 space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-neutral-900 rounded-full"></div>
                                    目標とするCVパーツ
                                </label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-neutral-400 hover:text-neutral-900"
                                    onClick={onManageConversions}
                                >
                                    管理画面へ
                                </Button>
                            </div>
                            
                            <div className="space-y-3">
                                {CV_PARTS.map((cv) => {
                                    const isSelected = config.cvIds.includes(cv.id);
                                    return (
                                        <div 
                                            key={cv.id}
                                            onClick={() => toggleCv(cv.id)}
                                            className={cn(
                                                "relative flex items-start gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 group select-none",
                                                isSelected 
                                                    ? "border-neutral-900 bg-white shadow-sm" 
                                                    : "border-transparent bg-neutral-50 hover:bg-neutral-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                isSelected ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-transparent"
                                            )}>
                                                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-base text-neutral-900">{cv.name}</span>
                                                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-600 font-bold uppercase tracking-wide">
                                                        {cv.type}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-neutral-500 leading-relaxed">
                                                    {cv.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Options */}
                        <div className="col-span-5 space-y-8 sticky top-8">
                             <div className="space-y-6">
                                <label className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-neutral-200 rounded-full"></div>
                                    分析オプション
                                </label>

                                {/* Volume Range */}
                                <div className="bg-white border-2 border-neutral-100 p-6 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                                            <BarChart3 size={16} />
                                            検索ボリューム
                                        </div>
                                        <div className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-3 py-1 rounded-full">
                                            {config.volumeRange[0].toLocaleString()} - {config.volumeRange[1].toLocaleString()}
                                        </div>
                                    </div>
                                    <Slider
                                        defaultValue={[1000, 50000]}
                                        max={100000}
                                        min={100}
                                        step={100}
                                        value={config.volumeRange}
                                        onValueChange={(val) => setConfig({...config, volumeRange: val as [number, number]})}
                                        className="py-2"
                                    />
                                    <div className="flex justify-between text-[10px] text-neutral-400 font-mono font-medium">
                                        <span>ニッチ (100)</span>
                                        <span>ビッグ (100k+)</span>
                                    </div>
                                </div>

                                {/* Priorities */}
                                <div className="space-y-3">
                                    <div className="text-sm font-bold text-neutral-900 pl-1">
                                        重視する項目
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'volume', label: 'ボリューム' },
                                            { id: 'competition', label: '競合性' },
                                            { id: 'trend', label: 'トレンド' },
                                            { id: 'relevance', label: '関連度' }
                                        ].map((metric) => (
                                            <button
                                                key={metric.id}
                                                onClick={() => {
                                                    const newMetrics = config.metrics.includes(metric.id)
                                                        ? config.metrics.filter(m => m !== metric.id)
                                                        : [...config.metrics, metric.id];
                                                    if (newMetrics.length > 0) setConfig({...config, metrics: newMetrics});
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-full text-sm font-bold border-2 transition-all",
                                                    config.metrics.includes(metric.id)
                                                        ? "bg-neutral-900 text-white border-neutral-900"
                                                        : "bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300"
                                                )}
                                            >
                                                {metric.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    onClick={startAnalysis}
                                    disabled={config.cvIds.length === 0}
                                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-14 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    <Search size={20} className="mr-2" />
                                    分析を開始する
                                </Button>
                                <p className="text-center text-xs text-neutral-400 mt-4">
                                    選択した条件に基づきAIが市場調査を行います
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'analyzing') {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md animate-in fade-in duration-700">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-neutral-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-neutral-900 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-neutral-900">市場データを分析中...</h2>
                        <p className="text-neutral-500 text-sm">
                            選択された {selectedCvs.length} 件のCVパーツに最適な<br/>
                            キーワードと記事構成を抽出しています
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 items-center text-xs text-neutral-400 font-mono pt-4">
                        <span className="animate-pulse delay-75">Targeting: {selectedCvs.map(cv => cv.name).join(', ')}...</span>
                        <span className="animate-pulse delay-150">Analyzing Competition...</span>
                        <span className="animate-pulse delay-300">Generating Titles...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-neutral-900 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <header className="h-20 flex-none px-8 flex items-center justify-between bg-white border-b border-neutral-100">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold tracking-tight text-neutral-900">分析結果一覧</h1>
                    <div className="h-4 w-px bg-neutral-200"></div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span className="font-medium">Target:</span>
                        <span className="px-2 py-0.5 bg-neutral-100 rounded-full font-bold text-neutral-900">
                            {selectedCvs.map(cv => cv.name).join(', ')}
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => setViewState('config')}
                        className="rounded-full font-bold text-xs px-4 h-9 border-neutral-200 hover:bg-neutral-50"
                    >
                        再分析
                    </Button>
                </div>
            </header>

            {/* Main Content Wrapper */}
            <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col min-h-0 relative">
                
                {/* Table Header */}
                <div className="flex-none grid grid-cols-12 gap-6 px-8 py-4 text-[11px] font-bold text-neutral-400 uppercase tracking-wider select-none border-b border-neutral-100">
                    <div className="col-span-3 flex items-center gap-3 pl-2">
                        <div 
                            className="flex items-center cursor-pointer hover:text-neutral-900 transition-colors"
                            onClick={() => handleSort('keyword')}
                        >
                            キーワード / Vol
                            <SortIcon columnKey="keyword" />
                        </div>
                    </div>
                    <div className="col-span-4">提案タイトル / 理由</div>
                    <div className="col-span-2">分析指標</div>
                    <div className="col-span-2">監修者</div>
                    <div className="col-span-1 text-right">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleToggleAllPlans}
                            className="h-6 text-[10px] px-2 font-bold text-neutral-500 hover:text-neutral-900"
                        >
                            {selectedPlanIds.size === plans.length && plans.length > 0 ? '全解除' : '全選択'}
                        </Button>
                    </div>
                </div>

                {/* List Content */}
                <ScrollArea className="flex-1 bg-neutral-50/30">
                    <div className="px-8 py-4 space-y-3">
                        {sortedPlans.map((plan, index) => {
                            const isSelected = selectedPlanIds.has(plan.id);
                            return (
                                <div 
                                    key={plan.id} 
                                    className={cn(
                                        "group grid grid-cols-12 gap-6 px-6 py-6 items-start rounded-2xl transition-all border shadow-sm bg-white",
                                        isSelected ? "ring-2 ring-neutral-900 border-transparent shadow-md z-10" : "border-neutral-100 hover:shadow-md hover:border-neutral-200"
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    
                                    {/* Keyword Column */}
                                    <div className="col-span-3 flex items-start gap-4">
                                        <div className="space-y-2">
                                            <div className="font-bold text-neutral-900 text-base leading-tight">{plan.keyword}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Vol</span>
                                                <span className="text-xs font-mono font-medium text-neutral-600">{plan.vol.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title & Reason Column */}
                                    <div className="col-span-4 space-y-3">
                                        <div className="relative group/input">
                                            <Input 
                                                defaultValue={plan.title}
                                                className="font-bold text-neutral-900 border-transparent bg-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-200 px-3 py-2 h-auto -ml-3 text-sm transition-all w-full rounded-lg"
                                            />
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/input:opacity-100 text-neutral-300 pointer-events-none">
                                                <FileText size={14} />
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2.5 px-0.5">
                                            <Sparkles size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                            <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                                                {plan.reason}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics Column (New) */}
                                    <div className="col-span-2 space-y-3 pt-1">
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">推定文字数</div>
                                            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                                                <FileText size={12} className="text-neutral-400" />
                                                {plan.estWordCount?.toLocaleString()} 文字
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">CV親和性</div>
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border",
                                                plan.cvAffinity === 'High' ? "bg-rose-50 text-rose-700 border-rose-100" :
                                                plan.cvAffinity === 'Medium' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                "bg-neutral-50 text-neutral-500 border-neutral-100"
                                            )}>
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    plan.cvAffinity === 'High' ? "bg-rose-500" :
                                                    plan.cvAffinity === 'Medium' ? "bg-amber-500" :
                                                    "bg-neutral-400"
                                                )} />
                                                {plan.cvAffinity === 'High' ? '高' : plan.cvAffinity === 'Medium' ? '中' : '低'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supervisor & Type */}
                                    <div className="col-span-2 space-y-3 pt-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                                {plan.supervisor?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-neutral-700">{plan.supervisor}</span>
                                        </div>
                                        <div className="inline-flex items-center px-2 py-1 bg-neutral-50 border border-neutral-100 rounded text-[10px] font-bold text-neutral-500">
                                            {plan.promptName}
                                        </div>
                                    </div>
                                    
                                    <div className="col-span-1 flex justify-end items-center h-full pt-2">
                                        <Button
                                            size="sm"
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => handleTogglePlan(plan.id)}
                                            className={cn(
                                                "rounded-full font-bold text-xs h-8 px-4 transition-all shadow-sm",
                                                isSelected 
                                                    ? "bg-neutral-900 text-white hover:bg-neutral-800" 
                                                    : "border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 bg-white"
                                            )}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check size={14} className="mr-1.5" /> 選択中
                                                </>
                                            ) : (
                                                "選択"
                                            )}
                                        </Button>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                
                {/* Floating Action Bar */}
                <div className={cn(
                    "absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out",
                    selectedPlanIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
                )}>
                    <div className="bg-neutral-900 text-white px-4 py-3 pl-8 rounded-full shadow-2xl flex items-center gap-8 min-w-[400px]">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">選択中</span>
                            <span className="text-xl font-bold leading-none">{selectedPlanIds.size} <span className="text-sm font-normal text-neutral-500">件の記事</span></span>
                        </div>
                        <Button 
                            onClick={handleBatchGenerate}
                            className="bg-white text-neutral-900 hover:bg-neutral-200 rounded-full px-8 h-12 font-bold text-base transition-colors ml-auto"
                        >
                            <Sparkles size={18} className="mr-2" />
                            記事を作成する
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
