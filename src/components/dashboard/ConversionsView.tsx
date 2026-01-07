'use client'

import React, { useState } from 'react';
import {
    Search, Image as ImageIcon, MoreHorizontal, X, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "../ui/dropdown-menu";
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import type { ConversionItem } from '../../types';
import { useConversions, useCreateConversion, useUpdateConversion, useDeleteConversion } from '../../lib/hooks';

interface ConversionsViewProps {
    conversions?: ConversionItem[];
    onConversionsChange?: (conversions: ConversionItem[]) => void;
}

export function ConversionsView({ conversions: _conversions, onConversionsChange: _onConversionsChange }: ConversionsViewProps) {
    // Use API hooks instead of props
    const { data: conversionsData, isLoading, error } = useConversions();
    const createConversion = useCreateConversion();
    const updateConversion = useUpdateConversion();
    const deleteConversion = useDeleteConversion();

    // Map API data to ConversionItem format
    const conversions: ConversionItem[] = (conversionsData?.data || []).map((cv: any) => ({
        id: cv.id,
        name: cv.name,
        type: cv.type,
        url: cv.url,
        thumbnail: cv.thumbnailUrl,
        status: cv.status,
        ctr: cv.ctr || '-',
        clicks: cv.clicks || 0,
        cv: cv.conversions || 0,
        period: cv.period,
        context: cv.context,
    }));
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ConversionItem | null>(null);
    const [formData, setFormData] = useState<Partial<ConversionItem>>({});

    const filteredConversions = conversions.filter(cv => 
        cv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({
            type: 'campaign',
            status: 'scheduled',
            clicks: 0,
            cv: 0,
            ctr: '-'
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: ConversionItem) => {
        setEditingItem(item);
        setFormData({ ...item });
        setIsDialogOpen(true);
    };

    const handleDuplicate = (item: ConversionItem) => {
        createConversion.mutate({
            name: `${item.name} (コピー)`,
            type: item.type,
            url: item.url,
            thumbnailUrl: item.thumbnail,
            status: 'scheduled',
            period: item.period,
            context: item.context,
        });
    };

    const handleDelete = (id: string) => {
        deleteConversion.mutate(id);
    };

    const handleSave = () => {
        const conversionData = {
            name: formData.name || '新規キャンペーン',
            type: formData.type || 'campaign',
            url: formData.url || '',
            thumbnailUrl: formData.thumbnail,
            status: formData.status || 'scheduled',
            period: formData.period || '',
            context: formData.context,
        };

        if (editingItem) {
            updateConversion.mutate({ id: editingItem.id, data: conversionData }, {
                onSuccess: () => setIsDialogOpen(false),
            });
        } else {
            createConversion.mutate(conversionData, {
                onSuccess: () => setIsDialogOpen(false),
            });
        }
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
        <div className="flex flex-col h-full bg-white text-neutral-900 font-sans">
            {/* Header */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">コンバージョン</h1>
                    <p className="text-sm text-neutral-500 font-medium">記事内CTAとバナーのパフォーマンス管理</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                        <Input 
                            className="w-[300px] pl-11 h-12 bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-full text-sm font-medium transition-all"
                            placeholder="キャンペーンを検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleCreate}
                        className="h-12 !px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm"
                    >
                        追加
                    </Button>
                </div>
            </header>

            {/* List Header */}
            <div className="flex-none grid grid-cols-12 gap-4 px-8 py-3 text-[11px] font-bold text-neutral-400 uppercase tracking-wider select-none border-b border-neutral-100/50">
                <div className="col-span-5 pl-2">キャンペーン / URL</div>
                <div className="col-span-2">ステータス</div>
                <div className="col-span-1 text-right">CTR</div>
                <div className="col-span-1 text-right">クリック数</div>
                <div className="col-span-1 text-right">CV数</div>
                <div className="col-span-1 text-right">CVR</div>
                <div className="col-span-1"></div>
            </div>

            {/* List Content */}
            <ScrollArea className="flex-1">
                <div className="px-4 pb-20 pt-2">
                    {filteredConversions.map(cv => (
                        <div key={cv.id} className="group grid grid-cols-12 gap-4 px-4 py-4 items-center rounded-2xl transition-all hover:bg-neutral-50 border border-transparent mb-0.5">
                            
                            {/* Info */}
                            <div className="col-span-5 flex gap-5 items-center overflow-hidden">
                                <div className="w-20 h-12 shrink-0 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200/50 relative">
                                    {cv.thumbnail ? (
                                        <img src={cv.thumbnail} alt={cv.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <ImageIcon size={18} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 gap-1">
                                    <h3 className="font-bold text-neutral-900 text-sm truncate leading-tight">{cv.name}</h3>
                                    <a href={cv.url} target="_blank" rel="noreferrer" className="text-[10px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1 truncate font-medium transition-colors">
                                        {cv.url.replace('https://', '')}
                                    </a>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={cn(
                                        "rounded-full px-2.5 py-1 text-[10px] font-bold border-0 uppercase tracking-wide",
                                        cv.status === 'active' ? "bg-emerald-50 text-emerald-700" :
                                        cv.status === 'scheduled' ? "bg-blue-50 text-blue-700" : "bg-neutral-100 text-neutral-500"
                                    )}>
                                        {cv.status === 'active' ? '公開中' : 
                                         cv.status === 'scheduled' ? '予約済み' : '終了'}
                                    </Badge>
                                    <span className="text-[10px] text-neutral-400 font-medium hidden xl:inline-block truncate max-w-[100px]">
                                        {cv.type}
                                    </span>
                                </div>
                            </div>

                            {/* Stats: CTR */}
                            <div className="col-span-1 text-right">
                                <span className="text-sm font-mono font-bold text-neutral-900">{cv.ctr}</span>
                            </div>

                            {/* Stats: Clicks */}
                            <div className="col-span-1 text-right">
                                <span className="text-sm font-mono font-medium text-neutral-600">{cv.clicks.toLocaleString()}</span>
                            </div>

                             {/* Stats: CV */}
                             <div className="col-span-1 text-right">
                                <span className="text-sm font-mono font-medium text-neutral-600">{cv.cv}</span>
                            </div>

                            {/* Stats: CVR */}
                            <div className="col-span-1 text-right">
                                <span className="text-sm font-mono font-bold text-neutral-900">
                                    {(cv.clicks > 0 ? ((cv.cv / cv.clicks) * 100).toFixed(2) : '0.00')}%
                                </span>
                            </div>

                            {/* Action */}
                            <div className="col-span-1 flex justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100">
                                            <MoreHorizontal size={16} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl border-neutral-100 shadow-lg p-1 w-40">
                                        <DropdownMenuItem onClick={() => handleEdit(cv)} className="rounded-lg text-xs font-bold cursor-pointer py-2">編集</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(cv)} className="rounded-lg text-xs font-bold cursor-pointer py-2">複製</DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-neutral-50" />
                                        <DropdownMenuItem onClick={() => handleDelete(cv.id)} className="text-red-600 rounded-lg text-xs font-bold cursor-pointer py-2 focus:text-red-700 focus:bg-red-50">削除</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'コンバージョン設定を編集' : '新しいコンバージョンを作成'}</DialogTitle>
                        <DialogDescription>
                            バナーやボタンのトラッキング設定を管理します。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-xs font-bold text-neutral-500">キャンペーン名</Label>
                            <Input 
                                id="name" 
                                value={formData.name || ''} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="キャンペーン名を入力" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type" className="text-xs font-bold text-neutral-500">種類</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(v: any) => setFormData({...formData, type: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="種類を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="campaign">キャンペーン</SelectItem>
                                        <SelectItem value="evergreen">常設コンテンツ</SelectItem>
                                        <SelectItem value="app">アプリ訴求</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status" className="text-xs font-bold text-neutral-500">ステータス</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(v: any) => setFormData({...formData, status: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="ステータスを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">公開中</SelectItem>
                                        <SelectItem value="scheduled">予約済み</SelectItem>
                                        <SelectItem value="ended">終了</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url" className="text-xs font-bold text-neutral-500">遷移先URL</Label>
                            <Input 
                                id="url" 
                                value={formData.url || ''} 
                                onChange={(e) => setFormData({...formData, url: e.target.value})}
                                placeholder="https://..." 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold text-neutral-500">サムネイル画像</Label>
                            <div className="flex items-start gap-4">
                                {formData.thumbnail ? (
                                    <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-neutral-200 group">
                                        <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setFormData({...formData, thumbnail: undefined})}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        className="w-40 h-24 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300 transition-colors cursor-pointer" 
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                    >
                                        <ImageIcon size={20} className="mb-1" />
                                        <span className="text-[10px] font-bold">画像を追加</span>
                                    </div>
                                )}
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const imageUrl = URL.createObjectURL(file);
                                            setFormData({ ...formData, thumbnail: imageUrl });
                                        }
                                    }} 
                                />
                                <div className="flex-1 pt-1">
                                    <p className="text-[11px] text-neutral-400 leading-tight">
                                        キャンペーンやバナーの画像を設定します。<br/>
                                        推奨サイズ: 1200x630px<br/>
                                        形式: JPG, PNG, WebP
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="period" className="text-xs font-bold text-neutral-500">期間 (任意)</Label>
                            <Input 
                                id="period" 
                                value={formData.period || ''} 
                                onChange={(e) => setFormData({...formData, period: e.target.value})}
                                placeholder="例: 2024/12/01 - 2025/01/31" 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="context" className="text-xs font-bold text-neutral-500">コンテキスト (AI生成用)</Label>
                            <Textarea 
                                id="context" 
                                value={formData.context || ''} 
                                onChange={(e) => setFormData({...formData, context: e.target.value})}
                                placeholder="このコンバージョンを記事内で紹介する際の文脈や訴求ポイントを入力してください..." 
                                className="h-20 resize-none text-xs"
                            />
                            <p className="text-[10px] text-neutral-400">
                                記事生成時にAIがこの情報を参照して、自然な形で商品やサービスを紹介します。
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave} className="bg-neutral-900 text-white hover:bg-neutral-800">保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}