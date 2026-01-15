import React, { useState, useEffect } from 'react';
import {
    Globe, BarChart3, Check, Cpu,
    Link2, AlertCircle, Search, Key,
    Sparkles, Loader2
} from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { useSettings, useUpdateSettings } from '@/app/admin/lib/hooks';

export function SettingsView() {
    // Use API hooks
    const { data: settings, isLoading, error } = useSettings();
    const updateSettings = useUpdateSettings();

    // Local state for form
    const [formData, setFormData] = useState({
        openRouterApiKey: '',
        dataforSeoApiKey: '',
        minSearchVolume: 300,
        maxSearchVolume: 2000,
        gaPropertyId: '',
        searchConsoleSiteUrl: '',
        imageModel: 'google/imagen-3',
        articleModel: 'anthropic/claude-sonnet-4',
        analysisModel: 'anthropic/claude-3.5-haiku',
    });

    // API key editing state
    const [isEditingApiKey, setIsEditingApiKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    const [isEditingDataforSeoKey, setIsEditingDataforSeoKey] = useState(false);
    const [newDataforSeoKey, setNewDataforSeoKey] = useState('');

    // Initialize form with API data
    useEffect(() => {
        if (settings) {
            setFormData({
                openRouterApiKey: settings.openRouterApiKey || '',
                dataforSeoApiKey: settings.dataforSeoApiKey || '',
                minSearchVolume: settings.minSearchVolume ?? 300,
                maxSearchVolume: settings.maxSearchVolume ?? 2000,
                gaPropertyId: settings.gaPropertyId || '',
                searchConsoleSiteUrl: settings.searchConsoleSiteUrl || '',
                imageModel: settings.imageModel || 'google/imagen-3',
                articleModel: settings.articleModel || 'anthropic/claude-sonnet-4',
                analysisModel: settings.analysisModel || 'anthropic/claude-3.5-haiku',
            });
        }
    }, [settings]);

    const handleSave = () => {
        // 編集中のAPIキーがあれば含める
        const dataToSave = {
            ...formData,
            // 編集中のOpenRouter APIキーがあれば使用
            ...(isEditingApiKey && newApiKey.trim()
                ? { openRouterApiKey: newApiKey.trim() }
                : {}),
            // 編集中のDataForSEO APIキーがあれば使用
            ...(isEditingDataforSeoKey && newDataforSeoKey.trim()
                ? { dataforSeoApiKey: newDataforSeoKey.trim() }
                : {}),
        };

        // マスク値は送信しない（バックエンドでスキップされるが、明示的に除外）
        if (dataToSave.openRouterApiKey === '********' || dataToSave.openRouterApiKey?.match(/^\*+$/)) {
            (dataToSave as any).openRouterApiKey = undefined;
        }
        if (dataToSave.dataforSeoApiKey === '********' || dataToSave.dataforSeoApiKey?.match(/^\*+$/)) {
            (dataToSave as any).dataforSeoApiKey = undefined;
        }

        updateSettings.mutate(dataToSave, {
            onSuccess: () => {
                // 編集モードを閉じる
                setIsEditingApiKey(false);
                setNewApiKey('');
                setIsEditingDataforSeoKey(false);
                setNewDataforSeoKey('');
            }
        });
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

                        {/* DataForSEO Card */}
                        <div className="group p-6 rounded-3xl border border-neutral-200 hover:border-neutral-300 transition-all bg-white hover:shadow-sm">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900">DataForSEO</h3>
                                        <p className="text-[10px] text-neutral-500">検索ボリューム取得API</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {settings?.dataforSeoApiKey ? (
                                                <>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <span className="text-xs font-bold text-emerald-600">API連携済み</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-neutral-400">未設定</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* API Key Input */}
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">APIキー（Base64形式）</Label>
                                    <div className="relative">
                                        {isEditingDataforSeoKey ? (
                                            <>
                                                <Input
                                                    type="text"
                                                    value={newDataforSeoKey}
                                                    onChange={(e) => setNewDataforSeoKey(e.target.value)}
                                                    className="h-10 bg-white border-neutral-200 rounded-xl font-mono text-xs pr-24"
                                                    placeholder="Base64エンコードされたAPIキーを入力..."
                                                    autoFocus
                                                />
                                                <div className="absolute right-1 top-1 flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            if (newDataforSeoKey.trim()) {
                                                                setFormData({...formData, dataforSeoApiKey: newDataforSeoKey.trim()});
                                                            }
                                                            setIsEditingDataforSeoKey(false);
                                                            setNewDataforSeoKey('');
                                                        }}
                                                        disabled={!newDataforSeoKey.trim()}
                                                        className="h-8 bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-[10px] px-2"
                                                    >
                                                        保存
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setIsEditingDataforSeoKey(false);
                                                            setNewDataforSeoKey('');
                                                        }}
                                                        className="h-8 text-neutral-400 hover:text-neutral-900 font-bold text-[10px] px-2"
                                                    >
                                                        取消
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Input
                                                    type="password"
                                                    value={settings?.dataforSeoApiKey ? '●'.repeat(20) : ''}
                                                    readOnly
                                                    className="h-10 bg-neutral-50 border-neutral-200 rounded-xl font-mono text-xs cursor-default"
                                                    placeholder="未設定"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsEditingDataforSeoKey(true);
                                                        setNewDataforSeoKey('');
                                                    }}
                                                    className="absolute right-1 top-1 h-8 bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-[10px]"
                                                >
                                                    {settings?.dataforSeoApiKey ? '変更' : '設定'}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-neutral-400 pl-1">
                                        ※ 「login:password」形式またはBase64エンコード済みの値を入力
                                    </p>
                                </div>

                                {/* Search Volume Range */}
                                <div className="space-y-3 pt-3 border-t border-neutral-100">
                                    <Label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider ml-1">推奨検索ボリューム範囲</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-neutral-500 ml-1">最小</Label>
                                            <Input
                                                type="number"
                                                value={formData.minSearchVolume}
                                                onChange={(e) => setFormData({...formData, minSearchVolume: parseInt(e.target.value) || 0})}
                                                className="h-10 bg-white border-neutral-200 rounded-xl text-sm font-bold"
                                                min={0}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-neutral-500 ml-1">最大</Label>
                                            <Input
                                                type="number"
                                                value={formData.maxSearchVolume}
                                                onChange={(e) => setFormData({...formData, maxSearchVolume: parseInt(e.target.value) || 0})}
                                                className="h-10 bg-white border-neutral-200 rounded-xl text-sm font-bold"
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-neutral-400 pl-1">
                                        ※ キーワード選定時にこの範囲内の検索ボリュームを優先します
                                    </p>
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
                                        {settings?.openRouterApiKey && (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-[10px] font-bold text-emerald-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                                設定済み
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    {isEditingApiKey ? (
                                        <>
                                            <Input
                                                type="text"
                                                value={newApiKey}
                                                onChange={(e) => setNewApiKey(e.target.value)}
                                                className="h-12 bg-white/10 border-white/20 rounded-xl font-mono text-sm pl-4 pr-28 text-white placeholder:text-white/30 focus:bg-white/20 focus:border-emerald-400 transition-all"
                                                placeholder="sk-or-v1-..."
                                                autoFocus
                                            />
                                            <div className="absolute right-2 top-2 flex gap-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        if (newApiKey.trim()) {
                                                            setFormData({...formData, openRouterApiKey: newApiKey.trim()});
                                                        }
                                                        setIsEditingApiKey(false);
                                                        setNewApiKey('');
                                                    }}
                                                    disabled={!newApiKey.trim()}
                                                    className="h-8 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs disabled:opacity-50"
                                                >
                                                    保存
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setIsEditingApiKey(false);
                                                        setNewApiKey('');
                                                    }}
                                                    className="h-8 text-white/70 hover:text-white hover:bg-white/10 font-bold text-xs"
                                                >
                                                    キャンセル
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Input
                                                type="password"
                                                value={settings?.openRouterApiKey ? '●'.repeat(30) : ''}
                                                readOnly
                                                className="h-12 bg-white/10 border-transparent rounded-xl font-mono text-sm pl-4 text-white placeholder:text-white/30 cursor-default"
                                                placeholder="APIキーが設定されていません"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setIsEditingApiKey(true);
                                                    setNewApiKey('');
                                                }}
                                                className="absolute right-2 top-2 h-8 bg-white text-neutral-900 hover:bg-neutral-200 font-bold text-xs"
                                            >
                                                {settings?.openRouterApiKey ? '変更' : '設定'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/50 mt-2 pl-1">
                                    ※ OpenRouterのAPIキーは安全に暗号化されて保存されます。変更後は「変更を保存」ボタンで確定してください。
                                </p>
                            </div>

                            {/* 使用中のモデル一覧（テキスト表示のみ） */}
                            <div className="bg-neutral-50 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                                    <span className="text-sm text-neutral-600">記事生成</span>
                                    <span className="text-sm font-bold text-neutral-900">{(settings as any)?.activeConfig?.models?.articleGeneration || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-neutral-200">
                                    <span className="text-sm text-neutral-600">画像生成</span>
                                    <span className="text-sm font-bold text-neutral-900">{(settings as any)?.activeConfig?.models?.imageGeneration || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-neutral-600">分析・リサーチ</span>
                                    <span className="text-sm font-bold text-neutral-900">{(settings as any)?.activeConfig?.models?.analysisModel || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="w-full h-px bg-neutral-100"></div>

                    {/* V6パイプライン情報（読み取り専用） */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Sparkles size={16} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900">V6 パイプライン設定</h2>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">現在のAI記事生成パイプラインの設定内容（読み取り専用）</p>
                                </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                システム設定
                            </Badge>
                        </div>

                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>読み取り専用</AlertTitle>
                            <AlertDescription>
                                V6プロンプトはシステムに組み込まれています。変更が必要な場合は開発者にご連絡ください。
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-bold text-neutral-700">
                                    パイプライン概要
                                </Label>
                                <div className="mt-2">
                                    <Textarea
                                        value={(settings as any)?.activeConfig?.v6Pipeline?.description || "読み込み中..."}
                                        readOnly
                                        className="font-mono text-sm bg-neutral-50 text-neutral-600 min-h-[400px] cursor-default"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
