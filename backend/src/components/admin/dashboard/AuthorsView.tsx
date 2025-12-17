'use client'

import React, { useState, useCallback } from 'react';
import { User, PenTool, Plus, Trash2, Search, Instagram, Facebook, Award, MoreHorizontal, Link as LinkIcon, Tag, Hash, MoreVertical, Check, ChevronDown, ArrowUpZA, ArrowDownAZ, X, Copy, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
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
import { cn } from '@/app/admin/lib/utils';
import { ConfirmDialog } from '../ui/confirm-dialog';
import type { Profile } from '@/app/admin/lib/types';
import { useAuthors, useCreateAuthor, useUpdateAuthor, useDeleteAuthor, useUploadMedia } from '@/app/admin/lib/hooks';

interface AuthorsViewProps {
    profiles?: Profile[];
    onProfilesChange?: (profiles: Profile[]) => void;
}

export function AuthorsView({ profiles: _profiles, onProfilesChange: _onProfilesChange }: AuthorsViewProps) {
    // Use API hooks instead of props
    const { data: authorsData, isLoading, error } = useAuthors();
    const createAuthor = useCreateAuthor();
    const updateAuthor = useUpdateAuthor();
    const deleteAuthor = useDeleteAuthor();
    const uploadMedia = useUploadMedia();

    // Map API data to Profile format
    const profiles: Profile[] = (authorsData?.data || []).map((author: any) => {
        // Handle socialLinks potentially being a string (JSON) or object
        const socialLinks = typeof author.socialLinks === 'string'
            ? JSON.parse(author.socialLinks)
            : author.socialLinks || {};

        // Handle qualifications being an array or string
        const qualificationsRaw = author.qualifications || [];
        const qualificationsStr = Array.isArray(qualificationsRaw)
            ? qualificationsRaw.join(', ')
            : String(qualificationsRaw);

        return {
            id: author.id,
            name: author.name,
            slug: author.slug,
            role: author.role || (author as any).title || '', // Fallback for API mismatch
            qualifications: qualificationsStr,
            categories: (author.categories && author.categories.length > 0) ? author.categories : (author.computedCategories || []),
            tags: (author.tags && author.tags.length > 0) ? author.tags : (author.computedTags || []),
            instagram: socialLinks.instagram,
            facebook: socialLinks.facebook,
            twitter: socialLinks.twitter,
            avatar: author.imageUrl || author.avatarUrl,
            bio: author.bio,
            systemPrompt: author.systemPrompt,
        };
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Form States
    const [formData, setFormData] = useState<Partial<Profile>>({});

    // Confirm Dialog States
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant?: 'default' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        onConfirm: () => {},
    });

    const handleOpenCreate = () => {
        setEditingProfile(null);
        setFormData({
            name: '', slug: '', role: '', qualifications: '', categories: [], tags: [],
            bio: '', avatar: '', instagram: '', facebook: '', twitter: '', systemPrompt: ''
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (profile: Profile) => {
        setEditingProfile(profile);
        setFormData({ ...profile });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        const profile = profiles.find(p => p.id === id);
        setConfirmDialog({
            open: true,
            title: '監修者を削除',
            description: `「${profile?.name || ''}」を削除してもよろしいですか？この操作は取り消せません。`,
            variant: 'destructive',
            onConfirm: () => {
                deleteAuthor.mutate(id);
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        setConfirmDialog({
            open: true,
            title: '一括削除',
            description: `選択した${selectedIds.size}件の監修者を削除してもよろしいですか？この操作は取り消せません。`,
            variant: 'destructive',
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, open: false }));
                // 並列実行し、エラーは個別のHookのonErrorで表示させる
                const promises = Array.from(selectedIds).map(id =>
                    deleteAuthor.mutateAsync(id).catch(() => null)
                );
                await Promise.all(promises);
                setSelectedIds(new Set());
            },
        });
    };

    const handleSubmit = () => {
        if (!formData.name) return; // nameのみ必須（slug/roleはAPIでデフォルト値が設定される）

        // 空文字列をundefinedに変換（APIでバリデーションエラーを防ぐ）
        const cleanString = (val: string | undefined | null): string | undefined => {
            if (val === null || val === undefined || val.trim() === '') return undefined;
            return val.trim();
        };

        // 画像URLの処理: アップロード済みURLをそのまま使用
        const getImageUrl = (): string | undefined => {
            const avatar = formData.avatar;
            if (!avatar || avatar.trim() === '') return undefined;
            // Base64データは無視（旧実装との互換性）
            if (avatar.startsWith('data:')) {
                return editingProfile?.avatar?.startsWith('data:') ? undefined : editingProfile?.avatar || undefined;
            }
            return avatar.trim();
        };

        const authorData = {
            name: formData.name.trim(),
            slug: formData.slug?.trim() || undefined,
            role: formData.role?.trim() || undefined,
            // Convert comma-separated string back to array for API
            qualifications: typeof formData.qualifications === 'string'
                ? formData.qualifications.split(/[,、]/).map(s => s.trim()).filter(Boolean)
                : formData.qualifications || [],
            categories: formData.categories || [],
            tags: formData.tags || [],
            socialLinks: {
                instagram: formData.instagram || '',
                facebook: formData.facebook || '',
                twitter: formData.twitter || '',
            },
            // 画像URL: Base64はスキップ、有効なURLのみ送信
            imageUrl: getImageUrl(),
            bio: cleanString(formData.bio),
            // systemPromptは明示的に空文字列を許可（削除するため）
            systemPrompt: formData.systemPrompt?.trim() ?? '',
        };

        if (editingProfile) {
            updateAuthor.mutate({ id: editingProfile.id, data: authorData }, {
                onSuccess: () => setIsDialogOpen(false),
            });
        } else {
            createAuthor.mutate(authorData, {
                onSuccess: () => setIsDialogOpen(false),
            });
        }
    };

    const uniqueCategories = Array.from(new Set(profiles.flatMap(p => p.categories))).sort();
    const uniqueTags = Array.from(new Set(profiles.flatMap(p => p.tags))).sort();
    const uniqueRoles = Array.from(new Set(profiles.map(p => p.role))).sort();

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profile.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
            profile.role.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        return Object.entries(activeFilters).every(([key, filterSet]) => {
            if (filterSet.size === 0) return true;
            // @ts-ignore
            const val = profile[key];
            if (Array.isArray(val)) return val.some(v => filterSet.has(v));
            return filterSet.has(val);
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
        setSelectedIds(checked ? new Set(filteredProfiles.map(p => p.id)) : new Set());
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
        <div className="flex flex-col h-full bg-white">
            {/* Header Area */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">監修者管理</h1>
                    <p className="text-sm text-neutral-500 font-medium">ライター・監修者の情報管理</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={18} />
                        <Input
                            className="w-[300px] pl-11 h-12 bg-neutral-100 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded-full text-sm font-medium transition-all"
                            placeholder="監修者を検索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenCreate} className="h-12 !px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm">
                        監修者追加
                    </Button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex items-center justify-between py-3 px-6 border-b border-neutral-100 bg-white flex-none">
                <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded">
                        {filteredProfiles.length} items
                    </div>
                    {(Object.keys(activeFilters).some(k => activeFilters[k].size > 0)) && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setActiveFilters({})}>
                            <X size={12} className="mr-1" /> フィルタ解除
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <Button variant="outline" size="sm" className="h-7 text-xs border-red-300 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400" onClick={handleBulkDelete}>
                            <Trash2 size={12} className="mr-1.5" /> 選択項目を削除
                        </Button>
                    )}
                </div>
            </div>

            {/* Table View */}
            <div className="flex-1 overflow-auto bg-white relative">
                <table className="w-full text-left border-collapse" style={{ minWidth: '1200px' }}>
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 border-r border-neutral-100/50 w-[40px] text-center sticky left-0 z-20">
                                {/* Actions Column Header */}
                            </th>
                            <th className="px-4 py-2.5 bg-neutral-50/80 border-b border-neutral-200 border-r border-neutral-100/50 w-[40px] text-center sticky left-[40px] z-20">
                                <input
                                    type="checkbox"
                                    checked={filteredProfiles.length > 0 && selectedIds.size === filteredProfiles.length}
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    className="rounded border-neutral-300 scale-90 cursor-pointer"
                                />
                            </th>
                            {renderHeaderCell("アイコン", "avatar", 60)}
                            {renderHeaderCell("名前", "name", 180)}
                            {renderHeaderCell("スラッグ", "slug", 120)}
                            {renderHeaderCell("肩書き", "role", 140, uniqueRoles)}
                            {renderHeaderCell("得意カテゴリ", "categories", 160, uniqueCategories)}
                            {renderHeaderCell("タグ", "tags", 160, uniqueTags)}
                            <th className="px-4 py-2.5 bg-neutral-50/80 text-xs text-neutral-500 font-medium border-b border-neutral-200 border-r border-neutral-100/50 w-[180px]">保有資格</th>
                            <th className="px-4 py-2.5 bg-neutral-50/80 text-xs text-neutral-500 font-medium border-b border-neutral-200 border-r border-neutral-100/50 w-[100px]">SNS</th>
                            <th className="px-4 py-2.5 bg-neutral-50/80 text-xs text-neutral-500 font-medium border-b border-neutral-200 w-auto">自己紹介</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {filteredProfiles.map(profile => (
                            <tr
                                key={profile.id}
                                className={cn(
                                    "group hover:bg-neutral-50/80 transition-colors",
                                    selectedIds.has(profile.id) && "bg-blue-50/50 hover:bg-blue-50/60"
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
                                            <DropdownMenuItem onSelect={() => {
                                                // 正しいフィールド名でAPIに送信
                                                const qualificationsArray = typeof profile.qualifications === 'string'
                                                    ? profile.qualifications.split(/[,、]/).map(s => s.trim()).filter(Boolean)
                                                    : [];
                                                createAuthor.mutate({
                                                    name: `${profile.name} (コピー)`,
                                                    slug: `${profile.slug}-copy-${Date.now()}`,
                                                    role: profile.role,
                                                    qualifications: qualificationsArray,
                                                    categories: profile.categories || [],
                                                    tags: profile.tags || [],
                                                    socialLinks: {
                                                        instagram: profile.instagram || '',
                                                        facebook: profile.facebook || '',
                                                        twitter: profile.twitter || '',
                                                    },
                                                    imageUrl: profile.avatar || undefined,
                                                    bio: profile.bio,
                                                    systemPrompt: profile.systemPrompt,
                                                });
                                            }}>
                                                <Copy size={14} className="mr-2" /> 複製
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleOpenEdit(profile)}>
                                                <PenTool size={14} className="mr-2" /> 編集
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => handleDelete(profile.id)}>
                                                <Trash2 size={14} className="mr-2" /> 削除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-4 py-3.5 bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50 sticky left-[40px] text-center z-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(profile.id)}
                                        onChange={() => toggleSelection(profile.id)}
                                        className="rounded border-neutral-300 scale-90 cursor-pointer"
                                    />
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <Avatar className="h-8 w-8 border border-neutral-100">
                                        <AvatarImage src={profile.avatar} />
                                        <AvatarFallback className="bg-neutral-100 text-neutral-500 text-[10px]">
                                            {profile.name.slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div
                                        className="font-medium text-neutral-900 text-sm leading-normal cursor-pointer hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-2 transition-all"
                                        onClick={() => handleOpenEdit(profile)}
                                    >
                                        {profile.name}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="text-xs text-neutral-500 font-mono truncate">
                                        {profile.slug}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="text-xs text-neutral-600 font-medium">
                                        {profile.role}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="flex flex-wrap gap-1">
                                        {profile.categories?.slice(0, 2).map((cat, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded border border-neutral-200 whitespace-nowrap">
                                                {cat}
                                            </span>
                                        ))}
                                        {(profile.categories?.length || 0) > 2 && (
                                            <span className="text-[10px] text-neutral-400">+{profile.categories.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="flex flex-wrap gap-1">
                                        {profile.tags?.slice(0, 2).map((tag, i) => (
                                            <span key={i} className="flex items-center gap-0.5 text-[10px] text-neutral-500 whitespace-nowrap">
                                                <Hash size={8} className="text-neutral-300" />
                                                {tag}
                                            </span>
                                        ))}
                                        {(profile.tags?.length || 0) > 2 && (
                                            <span className="text-[10px] text-neutral-400">+{profile.tags.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    {profile.qualifications && typeof profile.qualifications === 'string' && (
                                        <div className="flex flex-wrap gap-1">
                                            {profile.qualifications.split(/[,、]/).slice(0, 2).map((q, i) => (
                                                <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded border border-orange-100 whitespace-nowrap">
                                                    <Award size={10} className="text-orange-400" />
                                                    {q.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <div className="flex gap-1.5">
                                        {profile.instagram && (
                                            <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-pink-600 transition-colors">
                                                <Instagram size={14} />
                                            </a>
                                        )}
                                        {profile.facebook && (
                                            <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-blue-600 transition-colors">
                                                <Facebook size={14} />
                                            </a>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 align-middle bg-white group-hover:bg-neutral-50/80 transition-colors border-r border-neutral-100/50">
                                    <p className="text-[10px] text-neutral-500 line-clamp-2 max-w-md leading-relaxed">
                                        {profile.bio}
                                    </p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? '監修者を編集' : '新しい監修者を追加'}</DialogTitle>
                        <DialogDescription>
                            信頼性の高い監修者情報を作成してください。スラグはURLに使用されます。
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex items-start gap-6">
                            <div className="w-24 flex flex-col items-center gap-2 pt-2">
                                <Avatar className="h-24 w-24 border border-neutral-200">
                                    <AvatarImage src={formData.avatar} />
                                    <AvatarFallback className="text-2xl bg-neutral-50">
                                        {formData.name ? formData.name.slice(0, 2) : <User />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="w-full">
                                    <Label htmlFor="avatar-upload" className={cn(
                                        "block text-[10px] text-center cursor-pointer hover:underline mb-1",
                                        uploadMedia.isPending ? "text-neutral-400 pointer-events-none" : "text-blue-600"
                                    )}>
                                        {uploadMedia.isPending ? "アップロード中..." : "画像を変更"}
                                    </Label>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadMedia.isPending}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    const result = await uploadMedia.mutateAsync({ file });
                                                    if (result.data?.url) {
                                                        setFormData({ ...formData, avatar: result.data.url });
                                                    }
                                                } catch {
                                                    // エラーは useUploadMedia の onError で処理される
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-xs">名前 <span className="text-red-500">*</span></Label>
                                        <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-8 text-sm" placeholder="例: 山田 花子" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="slug" className="text-xs">スラグ (ID)</Label>
                                        <Input id="slug" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="h-8 text-sm font-mono" placeholder="例: hanako-yamada (空欄で自動生成)" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="role" className="text-xs">肩書き</Label>
                                    <Input id="role" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} className="h-8 text-sm" placeholder="例: ヨガインストラクター" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="qualifications" className="text-xs">保有資格 (カンマ区切り)</Label>
                                    <Input id="qualifications" value={formData.qualifications || ''} onChange={e => setFormData({ ...formData, qualifications: e.target.value })} className="h-8 text-sm" placeholder="例: RYT200, 管理栄養士" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="categories" className="text-xs">得意カテゴリー (カンマ区切り)</Label>
                                <Input
                                    id="categories"
                                    value={formData.categories?.join(', ') || ''}
                                    onChange={e => setFormData({ ...formData, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    className="h-8 text-sm"
                                    placeholder="例: ヨガ, 瞑想"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="tags" className="text-xs">タグ (カンマ区切り)</Label>
                                <Input
                                    id="tags"
                                    value={formData.tags?.join(', ') || ''}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    className="h-8 text-sm"
                                    placeholder="例: 初心者歓迎, 30代向け"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="systemPrompt" className="text-xs">システムプロンプト (専門性・トーンの指定)</Label>
                            <Textarea
                                id="systemPrompt"
                                value={formData.systemPrompt || ''}
                                onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                                className="text-sm min-h-[120px] font-mono"
                                placeholder="例: あなたはヨガのプロフェッショナルです。初心者にも分かりやすく、かつ解剖学的な根拠に基づいた解説を行ってください..."
                            />
                            <p className="text-[10px] text-neutral-500">
                                ※ 記事生成時にAIの役割（Role）として設定されます。E-E-A-T（経験・専門性・権威性・信頼性）を高めるための指示を記述してください。
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="bio" className="text-xs">自己紹介文</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio || ''}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                className="text-sm min-h-[80px]"
                                placeholder="読者に向けた自己紹介メッセージを入力してください。"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <Label htmlFor="instagram" className="text-xs flex items-center gap-1"><Instagram size={12} /> Instagram URL</Label>
                                <Input id="instagram" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} className="h-8 text-xs font-mono" placeholder="https://instagram.com/..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="facebook" className="text-xs flex items-center gap-1"><Facebook size={12} /> Facebook URL</Label>
                                <Input id="facebook" value={formData.facebook || ''} onChange={e => setFormData({ ...formData, facebook: e.target.value })} className="h-8 text-xs font-mono" placeholder="https://facebook.com/..." />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={uploadMedia.isPending}>キャンセル</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={uploadMedia.isPending || createAuthor.isPending || updateAuthor.isPending}
                        >
                            {(createAuthor.isPending || updateAuthor.isPending) ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    保存中...
                                </>
                            ) : uploadMedia.isPending ? (
                                "画像アップロード中..."
                            ) : (
                                "保存する"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                confirmLabel="削除"
                onConfirm={confirmDialog.onConfirm}
                isLoading={deleteAuthor.isPending}
            />
        </div>
    );
}