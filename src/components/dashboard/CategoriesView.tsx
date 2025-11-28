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
import { BulkActionBar } from './BulkActionBar';
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

    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        // In a real app, you would delete multiple items here
        const newCategories = categories.filter(c => !selectedIds.has(c.id));
        onCategoriesChange?.(newCategories);
        setSelectedIds(new Set());
    };

    const handleBulkPublish = () => {
        // Categories don't usually have a "publish" state like articles, 
        // but we'll keep the interface consistent or maybe just show a toast
        console.log("Bulk action for categories");
        setSelectedIds(new Set());
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
                                    <span className="text-xs font-medium text-neutral-600">
                                        {category.count}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <BulkActionBar 
                    selectedCount={selectedIds.size}
                    onClearSelection={handleClearSelection}
                    onPublish={handleBulkPublish}
                    onDelete={handleBulkDelete}
                />
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-xl h-[85vh] max-h-[800px] flex flex-col">
                    <div className="grid grid-cols-12 flex-1 min-h-0">
                        {/* Left Column: Basic Info */}
                        <div className="col-span-5 flex flex-col border-r border-neutral-100 bg-white h-full overflow-hidden">
                            <DialogHeader className="px-5 py-4 flex-none border-b border-neutral-50">
                                <DialogTitle className="text-base font-bold text-neutral-900">{editingCategory ? 'カテゴリー編集' : 'カテゴリー追加'}</DialogTitle>
                                <DialogDescription className="sr-only">
                                    カテゴリーの基本情報とAI生成設定を編集します。
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                                {/* Category Info Group */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">基本情報</h3>
                                    <div className="space-y-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="name" className="text-xs">カテゴリー名 <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="name" 
                                                placeholder="例: ヨガ" 
                                                className="h-8 text-xs"
                                                value={formData.name || ''}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="slug" className="text-xs">スラグ (URL) <span className="text-red-500">*</span></Label>
                                            <Input 
                                                id="slug" 
                                                placeholder="例: yoga" 
                                                className="font-mono text-xs h-8"
                                                value={formData.slug || ''}
                                                onChange={e => setFormData({...formData, slug: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-neutral-100" />

                                {/* Supervisor Info Group */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">監修者プロフィール</h3>
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">アイコン画像</Label>
                                        <div className="flex items-center gap-3">
                                            {formData.supervisorImage ? (
                                                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-neutral-200 group shrink-0">
                                                    <img src={formData.supervisorImage} alt="Preview" className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => setFormData({...formData, supervisorImage: undefined})}
                                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="text-white" size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="w-12 h-12 rounded-full bg-neutral-50 flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-100 cursor-pointer transition-colors border-2 border-dashed border-neutral-200 hover:border-neutral-300 shrink-0"
                                                    onClick={() => document.getElementById('supervisor-image-upload')?.click()}
                                                >
                                                    <ImageIcon size={16} className="mb-0.5" />
                                                    <span className="text-[8px] font-bold">Upload</span>
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
                                            <div className="flex-1">
                                                <p className="text-[10px] text-neutral-400 leading-tight">
                                                    200x200px 推奨
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label htmlFor="supervisor" className="text-xs">監修者名</Label>
                                        <Input 
                                            id="supervisor" 
                                            placeholder="例: 高橋 エマ"
                                            className="h-8 text-xs"
                                            value={formData.supervisorName || ''}
                                            onChange={e => setFormData({...formData, supervisorName: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="role" className="text-xs">肩書き/資格</Label>
                                        <Input 
                                            id="role" 
                                            placeholder="例: RYT200 認定講師"
                                            className="h-8 text-xs"
                                            value={formData.supervisorRole || ''}
                                            onChange={e => setFormData({...formData, supervisorRole: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: AI Settings */}
                        <div className="col-span-7 flex flex-col bg-neutral-50/30 h-full overflow-hidden">
                            <div className="flex-none px-5 py-4 border-b border-neutral-200/50 bg-neutral-50/80 backdrop-blur-sm z-10 flex items-center justify-between h-[57px]">
                                <div className="flex items-center gap-2 text-neutral-700">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <h3 className="font-bold text-xs">AI記事生成設定</h3>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                                {/* Context */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="supervisor-context" className="text-xs text-neutral-900">専門家コンテキスト</Label>
                                    <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm focus-within:ring-1 focus-within:ring-neutral-900 transition-all">
                                        <Textarea 
                                            id="supervisor-context" 
                                            placeholder="専門知識・経験・得意分野など..."
                                            className="min-h-[60px] h-16 border-none p-1 resize-none text-xs leading-relaxed focus-visible:ring-0 bg-transparent"
                                            value={(formData as any).expertContext || ''}
                                            onChange={e => setFormData({...formData, expertContext: e.target.value} as any)}
                                        />
                                    </div>
                                </div>

                                {/* Tone & Style */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-neutral-900">文体・トーン設定</Label>
                                    <div className="bg-white rounded-lg border border-neutral-200 p-3 shadow-sm space-y-3">
                                        {/* Style Radio */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className={cn(
                                                "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all hover:bg-neutral-50",
                                                (formData as any).writingStyle !== 'da-dearu' ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" : "border-neutral-200"
                                            )}>
                                                <input 
                                                    type="radio" 
                                                    name="writingStyle" 
                                                    value="desu-masu"
                                                    checked={(formData as any).writingStyle !== 'da-dearu'}
                                                    onChange={() => setFormData({...formData, writingStyle: 'desu-masu'} as any)}
                                                    className="hidden"
                                                />
                                                <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center shrink-0", (formData as any).writingStyle !== 'da-dearu' ? "border-neutral-900" : "border-neutral-300")}>
                                                    {(formData as any).writingStyle !== 'da-dearu' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                                                </div>
                                                <span className="text-xs font-bold text-neutral-900">です・ます調</span>
                                            </label>

                                            <label className={cn(
                                                "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all hover:bg-neutral-50",
                                                (formData as any).writingStyle === 'da-dearu' ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" : "border-neutral-200"
                                            )}>
                                                <input 
                                                    type="radio" 
                                                    name="writingStyle" 
                                                    value="da-dearu"
                                                    checked={(formData as any).writingStyle === 'da-dearu'}
                                                    onChange={() => setFormData({...formData, writingStyle: 'da-dearu'} as any)}
                                                    className="hidden"
                                                />
                                                <div className={cn("w-3 h-3 rounded-full border flex items-center justify-center shrink-0", (formData as any).writingStyle === 'da-dearu' ? "border-neutral-900" : "border-neutral-300")}>
                                                    {(formData as any).writingStyle === 'da-dearu' && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                                                </div>
                                                <span className="text-xs font-bold text-neutral-900">だ・である調</span>
                                            </label>
                                        </div>

                                        {/* Tone Slider */}
                                        <div className="space-y-2 pt-2 border-t border-neutral-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-neutral-500">トーンレベル</span>
                                                <span className="text-[10px] font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">Lv.{(formData as any).toneLevel ?? 3}</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="1" 
                                                max="5" 
                                                step="1"
                                                value={(formData as any).toneLevel ?? 3}
                                                onChange={(e) => setFormData({...formData, toneLevel: parseInt(e.target.value)} as any)}
                                                className="w-full accent-neutral-900 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between">
                                                <span className="text-[10px] font-medium text-neutral-400">フォーマル</span>
                                                <span className="text-[10px] font-medium text-neutral-400">カジュアル</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Persona */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">一人称</Label>
                                        <select 
                                            className="flex h-8 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-shadow"
                                            value={(formData as any).firstPerson || 'watashi'}
                                            onChange={(e) => setFormData({...formData, firstPerson: e.target.value} as any)}
                                        >
                                            <option value="watashi">私</option>
                                            <option value="hissha">筆者</option>
                                            <option value="none">使用しない</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">読者の呼び方</Label>
                                        <select 
                                            className="flex h-8 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-shadow"
                                            value={(formData as any).readerAddressing || 'anata'}
                                            onChange={(e) => setFormData({...formData, readerAddressing: e.target.value} as any)}
                                        >
                                            <option value="anata">あなた</option>
                                            <option value="minasan">皆さん</option>
                                            <option value="minasama">皆さま</option>
                                            <option value="none">使用しない</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Rules */}
                                <div className="space-y-1.5 pb-2">
                                    <Label htmlFor="prompt" className="text-xs">追加の文体ルール</Label>
                                    <div className="p-2 bg-white rounded-lg border border-neutral-200 shadow-sm focus-within:ring-1 focus-within:ring-neutral-900 transition-all">
                                        <Textarea 
                                            id="prompt" 
                                            placeholder="その他の特定の表現ルール..."
                                            className="h-12 border-none p-1 resize-none text-xs leading-relaxed focus-visible:ring-0 bg-transparent"
                                            value={formData.systemPrompt || ''}
                                            onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Actions inside Right Column to stick to bottom */}
                            <div className="flex-none p-4 border-t border-neutral-200 bg-white flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="text-xs h-8">キャンセル</Button>
                                <Button size="sm" onClick={handleSubmit} className="bg-neutral-900 text-white hover:bg-neutral-800 px-6 shadow-md text-xs h-8">保存</Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
