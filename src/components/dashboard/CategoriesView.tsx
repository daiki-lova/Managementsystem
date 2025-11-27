import React, { useState } from 'react';
import { FolderOpen, PenTool, Plus, Trash2, Search, MoreVertical, Copy, ChevronDown, ArrowUpZA, ArrowDownAZ, X, User, MessageSquare, UserCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { cn } from '../../lib/utils';
import type { Category } from '../../types';

interface CategoriesViewProps {
    categories?: Category[];
    onCategoriesChange?: (categories: Category[]) => void;
}

export function CategoriesView({ categories = [], onCategoriesChange }: CategoriesViewProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Form States
    const [formData, setFormData] = useState<Partial<Category>>({});

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setFormData({ name: '', slug: '', description: '', color: 'bg-neutral-100 text-neutral-700' });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ ...category });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('このカテゴリーを削除してもよろしいですか？')) {
            onCategoriesChange?.(categories.filter(c => c.id !== id));
        }
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.slug) return;

        if (editingCategory) {
            // Update
            onCategoriesChange?.(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } as Category : c));
        } else {
            // Create
            const newCategory: Category = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name!,
                slug: formData.slug!,
                description: formData.description,
                count: 0,
                supervisorName: formData.supervisorName,
                supervisorRole: formData.supervisorRole,
                supervisorImage: formData.supervisorImage,
                systemPrompt: formData.systemPrompt,
                color: formData.color
            };
            onCategoriesChange?.([...categories, newCategory]);
        }
        setIsDialogOpen(false);
    };

    const filteredCategories = categories.filter(category => {
        const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              category.slug.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        return Object.entries(activeFilters).every(([key, filterSet]) => {
            if (filterSet.size === 0) return true;
            // @ts-ignore
            const val = category[key];
            return filterSet.has(String(val));
        });
    }).sort((a, b) => {
        if (!sortConfig) return 0;
        // @ts-ignore
        const aVal = a[sortConfig.key];
        // @ts-ignore
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(filteredCategories.map(c => c.id)) : new Set());
    };

    const toggleFilter = (key: string, value: string, checked: boolean) => {
        const newFilters = { ...activeFilters };
        if (!newFilters[key]) newFilters[key] = new Set();
        if (checked) newFilters[key].add(value);
        else newFilters[key].delete(value);
        setActiveFilters(newFilters);
    };

    const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
        setSortConfig(direction ? { key, direction } : null);
    };

    const renderHeaderCell = (label: string, key: string, width: number, filterOptions?: string[]) => {
        const isFilterable = !!filterOptions;
        const isSortable = true;

        return (
            <th 
                className="px-4 py-2.5 relative bg-neutral-50/80 select-none whitespace-nowrap text-xs text-neutral-500 font-medium group border-b border-neutral-200 border-r border-neutral-100/50"
                style={{ width }}
            >
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 hover:bg-neutral-100 rounded px-1 py-0.5 -ml-1 transition-colors outline-none group/btn",
                                (activeFilters[key]?.size ?? 0) > 0 && "text-blue-600 bg-blue-50 hover:bg-blue-100",
                                sortConfig?.key === key && "text-blue-600"
                            )}>
                                {label}
                                {(isFilterable || isSortable) && (
                                    <ChevronDown size={10} className={cn("text-neutral-300 group-hover/btn:text-neutral-500", (activeFilters[key]?.size ?? 0) > 0 && "text-blue-400")} />
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="start">
                             <div className="space-y-2">
                                <div className="text-xs font-medium text-neutral-500 px-2 py-1">{label}</div>
                                
                                {isSortable && (
                                    <div className="space-y-1 border-b border-neutral-100 pb-2 mb-2">
                                        <button onClick={() => handleSort(key, 'asc')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100">
                                            <ArrowUpZA size={14} className="text-neutral-400" /> 昇順
                                        </button>
                                        <button onClick={() => handleSort(key, 'desc')} className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-neutral-100">
                                            <ArrowDownAZ size={14} className="text-neutral-400" /> 降順
                                        </button>
                                    </div>
                                )}

                                {isFilterable && (
                                     <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                        {filterOptions.map((opt) => (
                                            <div key={opt} className="flex items-center justify-between px-2 py-1.5 hover:bg-neutral-50 rounded">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={activeFilters[key]?.has(opt) || false}
                                                        onChange={(e) => toggleFilter(key, opt, e.target.checked)}
                                                        className="rounded border-neutral-300 text-blue-600"
                                                    />
                                                    <span className="text-sm text-neutral-700 truncate">{opt}</span>
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </th>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Area */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">カテゴリー管理</h1>
                    <p className="text-sm text-neutral-500 font-medium">記事の分類と構造化</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                        <Input 
                            className="w-[300px] pl-11 h-12 bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-full text-sm font-medium transition-all"
                            placeholder="カテゴリーを検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenCreate} className="h-12 !px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm">
                        カテゴリー追加
                    </Button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center justify-between py-3 px-6 border-b border-neutral-100 bg-white flex-none">
                <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                        {filteredCategories.length} items
                    </div>
                    {(Object.keys(activeFilters).some(k => activeFilters[k].size > 0)) && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setActiveFilters({})}>
                            <X size={12} className="mr-1" /> フィルタ解除
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-neutral-200 text-red-600 hover:bg-red-50 hover:border-red-200">
                            <Trash2 size={12} className="mr-1.5" /> 選択項目を削除
                        </Button>
                    )}
                </div>
            </div>

            {/* Table View */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
                    <thead className="sticky top-0 z-20">
                        <tr>
                             <th className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 border-r border-neutral-100/50 w-[40px] text-center sticky left-0 z-20">
                                {/* Actions Column Header */}
                            </th>
                            <th className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 border-r border-neutral-100/50 w-[40px] text-center sticky left-[40px] z-20">
                                <input 
                                    type="checkbox" 
                                    checked={filteredCategories.length > 0 && selectedIds.size === filteredCategories.length}
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    className="rounded border-neutral-300 scale-90 cursor-pointer"
                                />
                            </th>
                            {renderHeaderCell("カテゴリー名", "name", 220)}
                            {renderHeaderCell("スラッグ", "slug", 150)}
                            {renderHeaderCell("監修者設定", "supervisorName", 180)}
                            {renderHeaderCell("システムプロンプト", "systemPrompt", 250)}
                            {renderHeaderCell("説明", "description", 200)}
                            {renderHeaderCell("記事数", "count", 80)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {filteredCategories.map(category => (
                            <tr 
                                key={category.id} 
                                className={cn(
                                    "group hover:bg-neutral-50/80 transition-colors",
                                    selectedIds.has(category.id) && "bg-blue-50/50 hover:bg-blue-50/60"
                                )}
                            >
                                <td className="px-2 py-3.5 bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50 sticky left-0 text-center z-10">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-900 transition-colors outline-none focus:bg-neutral-100">
                                                <MoreVertical size={14} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-32">
                                             <DropdownMenuItem onClick={() => {
                                                 const newCategory = { ...category, id: Math.random().toString(36).substr(2, 9), name: `${category.name} (Copy)` };
                                                 onCategoriesChange?.([...categories, newCategory]);
                                             }}>
                                                <Copy size={14} className="mr-2" /> 複製
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleOpenEdit(category)}>
                                                <PenTool size={14} className="mr-2" /> 編集
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(category.id)}>
                                                <Trash2 size={14} className="mr-2" /> 削除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-4 py-3.5 bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50 sticky left-[40px] text-center z-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(category.id)}
                                        onChange={() => toggleSelection(category.id)}
                                        className="rounded border-neutral-300 scale-90 cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center text-neutral-400">
                                            <FolderOpen size={16} />
                                        </div>
                                        <span 
                                            className="font-medium text-neutral-900 text-sm leading-normal cursor-pointer hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 transition-all"
                                            onClick={() => handleOpenEdit(category)}
                                        >
                                            {category.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <span className="text-xs text-neutral-500 font-mono bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-100">
                                        /{category.slug}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    {category.supervisorName ? (
                                        <div className="flex items-center gap-2">
                                            {category.supervisorImage ? (
                                                <img 
                                                    src={category.supervisorImage} 
                                                    alt={category.supervisorName} 
                                                    className="w-6 h-6 rounded-full object-cover border border-neutral-100"
                                                />
                                            ) : (
                                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", category.color?.split(' ')[0] || "bg-neutral-100", category.color?.split(' ')[1] || "text-neutral-600")}>
                                                    {category.name[0]}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-neutral-900">{category.supervisorName}</span>
                                                <span className="text-[10px] text-neutral-500">{category.supervisorRole}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    {category.systemPrompt ? (
                                        <div className="flex items-start gap-1.5">
                                            <Sparkles size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-neutral-600 line-clamp-2 font-mono leading-relaxed" title={category.systemPrompt}>
                                                {category.systemPrompt}
                                            </p>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <p className="text-xs text-neutral-500 line-clamp-1">
                                        {category.description}
                                    </p>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <span className="text-xs font-medium text-neutral-600">
                                        {category.count}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'カテゴリーを編集' : '新しいカテゴリーを追加'}</DialogTitle>
                        <DialogDescription>
                            記事を分類するためのカテゴリー情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">カテゴリー名 <span className="text-red-500">*</span></Label>
                            <Input 
                                id="name" 
                                placeholder="例: ヨガ" 
                                value={formData.name || ''}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">スラグ (URL) <span className="text-red-500">*</span></Label>
                            <Input 
                                id="slug" 
                                placeholder="例: yoga" 
                                className="font-mono text-xs"
                                value={formData.slug || ''}
                                onChange={e => setFormData({...formData, slug: e.target.value})}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">説明</Label>
                            <Textarea 
                                id="description" 
                                placeholder="カテゴリーの説明を入力してください..."
                                className="h-20 resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="border-t border-neutral-100 pt-4 mt-2 space-y-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-500" />
                                <h3 className="text-sm font-bold text-neutral-900">AI生成設定（監修者・プロンプト）</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="supervisor">監修者名</Label>
                                    <Input 
                                        id="supervisor" 
                                        placeholder="例: 高橋 エマ"
                                        value={formData.supervisorName || ''}
                                        onChange={e => setFormData({...formData, supervisorName: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">肩書き/資格</Label>
                                    <Input 
                                        id="role" 
                                        placeholder="例: RYT200 認定講師"
                                        value={formData.supervisorRole || ''}
                                        onChange={e => setFormData({...formData, supervisorRole: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>監修者アイコン画像</Label>
                                <div className="flex items-start gap-4">
                                    {formData.supervisorImage ? (
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-neutral-200 group">
                                            <img src={formData.supervisorImage} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setFormData({...formData, supervisorImage: undefined})}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="text-white" size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-200 cursor-pointer transition-colors border border-neutral-200"
                                            onClick={() => document.getElementById('supervisor-image-upload')?.click()}
                                        >
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                    <input 
                                        id="supervisor-image-upload"
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData({ ...formData, supervisorImage: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <div className="flex-1 pt-1">
                                        <p className="text-[11px] text-neutral-500">
                                            クリックして画像をアップロード、またはドラッグ&ドロップ。<br />
                                            推奨: 200x200px (正方形)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="prompt">システムプロンプト（トーン・ルール）</Label>
                                <Textarea 
                                    id="prompt" 
                                    placeholder="例: 初心者に寄り添う優しいトーンで執筆してください。専門用語には必ず解説を入れてください。"
                                    className="h-24 resize-none text-xs font-mono leading-relaxed"
                                    value={formData.systemPrompt || ''}
                                    onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                                />
                                <p className="text-[10px] text-neutral-400">
                                    このカテゴリーの記事をAI生成する際に、常に適用される指示です。
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSubmit} className="bg-neutral-900 text-white hover:bg-neutral-800">保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
