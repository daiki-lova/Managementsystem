import React, { useState, useEffect } from 'react';
import {
    Globe, BarChart3, Check, Cpu, Zap,
    Shield, Settings, Link2, AlertCircle,
    Image as ImageIcon, FileText, Search, Key,
    Sparkles, MessageSquare, Loader2
} from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { cn } from '../../lib/utils';
import { useSettings, useUpdateSettings } from '../../lib/hooks';

export function SettingsView() {
    // Use API hooks
    const { data: settings, isLoading, error } = useSettings();
    const updateSettings = useUpdateSettings();

    // Local state for form
    const [formData, setFormData] = useState({
        openRouterApiKey: '',
        gaPropertyId: '',
        gscSiteUrl: '',
        imageModel: 'pro',
        articleModel: 'pro',
        analysisModel: 'banana',
        keywordPrompt: '',
        structurePrompt: '',
        proofreadingPrompt: '',
        seoPrompt: '',
    });

    // Initialize form with API data
    useEffect(() => {
        if (settings) {
            setFormData({
                openRouterApiKey: settings.openRouterApiKey || '',
                gaPropertyId: settings.gaPropertyId || '',
                gscSiteUrl: settings.gscSiteUrl || '',
                imageModel: settings.imageModel || 'pro',
                articleModel: settings.articleModel || 'pro',
                analysisModel: settings.analysisModel || 'banana',
                keywordPrompt: settings.keywordPrompt || '',
                structurePrompt: settings.structurePrompt || '',
                proofreadingPrompt: settings.proofreadingPrompt || '',
                seoPrompt: settings.seoPrompt || '',
            });
        }
    }, [settings]);

    const handleSave = () => {
        updateSettings.mutate(formData);
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                <p className="mt-2 text-sm text-neutral-500">読み込み中...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col h-full bg-white items-center justify-center">
                <p className="text-sm text-red-500">データの読み込みに失敗しました</p>
                <p className="mt-1 text-xs text-neutral-400">{(error as Error).message}</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col h-full bg-white text-neutral-900 font-sans animate-in fade-in duration-500">
            {/* Header */}
            <header className="h-24 flex-none px-10 flex items-center justify-between bg-white border-b border-neutral-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900">システム設定</h1>
                    <p className="text-sm text-neutral-500 font-medium mt-1">外部サービス連携とAIモデルの管理設定</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="h-10 px-4 rounded-full font-bold text-xs text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900">
                        初期設定に戻す
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updateSettings.isPending}
                        className="bg-neutral-900 text-white hover:bg-neutral-800 h-11 px-8 rounded-full font-bold text-sm shadow-lg shadow-neutral-900/10 transition-all hover:shadow-xl hover:scale-[1.02]"
                    >
                        {updateSettings.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                保存中...
                            </>
                        ) : (
                            '変更を保存'
                        )}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="w-full max-w-6xl mx-auto px-10 py-12 space-y-12">
                    
                    {/* Group 1: Integrations */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Link2 size={16} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-lg font-bold text-neutral-900">外部連携</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            {/* GA4 Card - OAuth Style */}
                            <div className="group p-6 rounded-3xl border border-neutral-200 hover:border-neutral-300 transition-all bg-white hover:shadow-sm">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#FFF4E5] flex items-center justify-center text-[#E37400]">
                                            <BarChart3 size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900">Google Analytics 4</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-xs font-bold text-emerald-600">データ受信中</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={true} className="data-[state=checked]:bg-neutral-900" />
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Connected Account Info */}
                                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                Y
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-neutral-900">yamada@demo.com</p>
                                                <p className="text-[10px] text-neutral-500">Google アカウント連携済み</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-neutral-400 hover:text-neutral-900 px-2">
                                            解除
                                        </Button>
                                    </div>

                                    {/* Property Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">連携プロパティ</Label>
                                        <Select defaultValue="prop-1">
                                            <SelectTrigger className="h-10 bg-white border-neutral-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-neutral-900">
                                                <SelectValue placeholder="プロパティを選択" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-neutral-200">
                                                <SelectItem value="prop-1" className="text-xs font-bold">Yoga Media Main (G-A1B2C3...)</SelectItem>
                                                <SelectItem value="prop-2" className="text-xs font-bold">Yoga Store (G-X9Y8Z7...)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Search Console Card - OAuth Style */}
                            <div className="group p-6 rounded-3xl border border-neutral-200 hover:border-neutral-300 transition-all bg-white hover:shadow-sm">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#E8F0FE] flex items-center justify-center text-[#1A73E8]">
                                            <Globe size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-neutral-900">Search Console</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-xs font-bold text-emerald-600">自動同期ON</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Switch defaultChecked={true} className="data-[state=checked]:bg-neutral-900" />
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Account Info - Reused if connected, otherwise button */}
                                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                Y
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-neutral-900">yamada@demo.com</p>
                                                <p className="text-[10px] text-neutral-500">Google アカウント連携済み</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] text-neutral-400 hover:text-neutral-900 px-2">
                                            解除
                                        </Button>
                                    </div>

                                    {/* Property Selection */}
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">管理サイト</Label>
                                        <Select defaultValue="site-1">
                                            <SelectTrigger className="h-10 bg-white border-neutral-200 rounded-xl text-xs font-bold focus:ring-1 focus:ring-neutral-900">
                                                <SelectValue placeholder="サイトを選択" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-neutral-200">
                                                <SelectItem value="site-1" className="text-xs font-bold">https://yoga-media.com</SelectItem>
                                                <SelectItem value="site-2" className="text-xs font-bold">https://shop.yoga-media.com</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-neutral-400 pl-1">※ 選択したサイトの検索パフォーマンスデータを取得します</p>
                                    </div>

                                    <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-neutral-500">XMLサイトマップ</span>
                                            <Check size={14} className="text-emerald-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-neutral-500">Indexing API</span>
                                            <span className="text-[10px] text-neutral-300">未設定</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-neutral-100"></div>

                    {/* Group 2: AI Core */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <Cpu size={16} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-lg font-bold text-neutral-900">AIモデル設定</h2>
                        </div>

                        <div className="space-y-6">
                            {/* API Key Configuration */}
                            <div className="bg-neutral-900 text-white rounded-3xl p-6 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Key size={18} className="text-emerald-400" />
                                        <h3 className="font-bold">OpenRouter API Configuration</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold">
                                            残高: $14.20
                                        </div>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold">
                                            Usage Tier 2
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Input 
                                        type="password"
                                        value="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        readOnly
                                        className="h-12 bg-white/10 border-transparent rounded-xl font-mono text-sm pl-4 text-white placeholder:text-white/30 focus:bg-white/20 transition-all"
                                        placeholder="OpenRouter API Key (sk-or-...)"
                                    />
                                    <Button 
                                        size="sm" 
                                        className="absolute right-2 top-2 h-8 bg-white text-neutral-900 hover:bg-neutral-200 font-bold text-xs"
                                    >
                                        変更
                                    </Button>
                                </div>
                                <p className="text-[10px] text-white/50 mt-2 pl-1">
                                    ※ OpenRouterのAPIキーは安全に暗号化されて保存されます
                                </p>
                            </div>

                            {/* Model Selection Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Card 1: Image Generation */}
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 text-neutral-900 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                                            <ImageIcon size={16} />
                                        </div>
                                        <span className="font-bold text-sm">画像生成</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-neutral-400">使用モデル</Label>
                                        <Select defaultValue="pro">
                                            <SelectTrigger className="h-10 text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="latest">最新モデル (Auto)</SelectItem>
                                                <SelectItem value="pro">Pro (DALL-E 3 / Midjourney)</SelectItem>
                                                <SelectItem value="banana">Banana (Stable Diffusion XL)</SelectItem>
                                                <SelectItem value="nano">Nano (Fast Generate)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Card 2: Article Creation */}
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 text-neutral-900 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <FileText size={16} />
                                        </div>
                                        <span className="font-bold text-sm">記事作成</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-neutral-400">使用モデル</Label>
                                        <Select defaultValue="pro">
                                            <SelectTrigger className="h-10 text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="latest">最新モデル (Auto)</SelectItem>
                                                <SelectItem value="pro">Pro (GPT-4o / Claude 3.5)</SelectItem>
                                                <SelectItem value="banana">Banana (Llama 3 70B)</SelectItem>
                                                <SelectItem value="nano">Nano (Gemini Flash)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Card 3: Analysis */}
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-2 text-neutral-900 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <Search size={16} />
                                        </div>
                                        <span className="font-bold text-sm">分析・リサーチ</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-neutral-400">使用モデル</Label>
                                        <Select defaultValue="banana">
                                            <SelectTrigger className="h-10 text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="latest">最新モデル (Auto)</SelectItem>
                                                <SelectItem value="pro">Pro (GPT-4o / Opus)</SelectItem>
                                                <SelectItem value="banana">Banana (Haiku / Turbo)</SelectItem>
                                                <SelectItem value="nano">Nano (Local / Small)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-neutral-100"></div>

                    {/* Group 3: System Prompts (NEW) */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                <MessageSquare size={16} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-lg font-bold text-neutral-900">システムプロンプト設定</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* 1行目左：キーワード分析・企画 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold text-neutral-900">キーワード分析・企画</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-neutral-400 hover:text-neutral-900">デフォルトに戻す</Button>
                                </div>
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white focus-within:ring-1 focus-within:ring-neutral-900 transition-shadow shadow-sm">
                                    <Textarea 
                                        className="min-h-[180px] border-none p-0 resize-none text-xs leading-relaxed focus-visible:ring-0 placeholder:text-neutral-300"
                                        defaultValue={`あなたはWebメディアの編集長です。
与えられたキーワードやテーマに基づき、検索意図（インサイト）を深く分析してください。
以下の観点を重視して企画案を作成してください：
1. ターゲット読者の潜在的な悩み
2. 競合記事にはない独自の切り口（一次情報の活用など）
3. SEOにおける勝ち筋（共起語、関連クエリの網羅）`}
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 pl-1">キーワードの検索意図分析と記事企画の作成時に使用されます</p>
                            </div>

                            {/* 1行目右：構成案生成 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold text-neutral-900">構成案生成</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-neutral-400 hover:text-neutral-900">デフォルトに戻す</Button>
                                </div>
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white focus-within:ring-1 focus-within:ring-neutral-900 transition-shadow shadow-sm">
                                    <Textarea 
                                        className="min-h-[180px] border-none p-0 resize-none text-xs leading-relaxed focus-visible:ring-0 placeholder:text-neutral-300"
                                        defaultValue={`あなたは熟練のWebライターです。
作成された企画案に基づき、記事全体の構成（H2, H3見出し）を作成してください。
構成作成のルール：
- 読者が知りたい結論を最初に提示する（PREP法）
- 読み飛ばしを防ぐため、見出しは具体的かつ魅力的にする
- 各セクションの役割を明確にし、論理的な流れを作る
- 記事の最後には、具体的なアクションプラン（まとめ）を提示する`}
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 pl-1">H2・H3見出しの階層構造を作成する際に使用されます</p>
                            </div>

                            {/* 2行目左：校正・推敲 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold text-neutral-900">校正・推敲</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-neutral-400 hover:text-neutral-900">デフォルトに戻す</Button>
                                </div>
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white focus-within:ring-1 focus-within:ring-neutral-900 transition-shadow shadow-sm">
                                    <Textarea 
                                        className="min-h-[180px] border-none p-0 resize-none text-xs leading-relaxed focus-visible:ring-0 placeholder:text-neutral-300"
                                        placeholder="校正・推敲の指示を入力してください..."
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 pl-1">誤字脱字、表記ゆれ、ファクトチェックの基準として使用されます</p>
                            </div>

                            {/* 2行目右：SEO最適化 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-bold text-neutral-900">SEO最適化</Label>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-neutral-400 hover:text-neutral-900">デフォルトに戻す</Button>
                                </div>
                                <div className="p-5 rounded-2xl border border-neutral-200 bg-white focus-within:ring-1 focus-within:ring-neutral-900 transition-shadow shadow-sm">
                                    <Textarea 
                                        className="min-h-[180px] border-none p-0 resize-none text-xs leading-relaxed focus-visible:ring-0 placeholder:text-neutral-300"
                                        placeholder="SEO最適化の指示を入力してください..."
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-400 pl-1">メタ情報の生成、キーワード配置、内部リンク提案に使用されます</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
