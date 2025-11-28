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
                // System Prompt is NOT managed in Category anymore, it comes from Author
                // But for backward compatibility we might keep it undefined or remove it from type eventually
                // For now, we just don't set it here
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
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl flex flex-col">
                    <div className="flex-1 min-h-0 bg-white">
                        <DialogHeader className="px-5 py-4 border-b border-neutral-50">
                            <DialogTitle className="text-base font-bold text-neutral-900">{editingCategory ? 'カテゴリー編集' : 'カテゴリー追加'}</DialogTitle>
                            <DialogDescription className="sr-only">
                                カテゴリーの基本情報を編集します。
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-6 space-y-6">
                            {/* Category Info Group */}
                            <div className="space-y-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name" className="text-xs">カテゴリー名 <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="name" 
                                        placeholder="例: ヨガ" 
                                        className="h-9 text-sm"
                                        value={formData.name || ''}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="slug" className="text-xs">スラグ (URL) <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="slug" 
                                        placeholder="例: yoga" 
                                        className="font-mono text-sm h-9"
                                        value={formData.slug || ''}
                                        onChange={e => setFormData({...formData, slug: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="description" className="text-xs">カテゴリー概要</Label>
                                    <Textarea 
                                        id="description" 
                                        placeholder="このカテゴリーの説明を入力してください。" 
                                        className="h-20 text-sm"
                                        value={formData.description || ''}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <DialogFooter className="px-5 py-4 bg-neutral-50 border-t border-neutral-100">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                            <Button onClick={handleSubmit}>保存する</Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}