'use client'

import React, { useState, useCallback } from 'react';
import { User, PenTool, Plus, Trash2, Search, MoreHorizontal, MoreVertical, Check, ChevronDown, ArrowUpZA, ArrowDownAZ, X, Copy, Loader2, AlertTriangle, Calendar, Users, GraduationCap, BookOpen, Sparkles } from 'lucide-react';
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '../ui/tabs';
import { cn } from '@/app/admin/lib/utils';
import { ConfirmDialog } from '../ui/confirm-dialog';
import type { Profile, Certification, Episode } from '@/app/admin/lib/types';
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
        // Handle JSON fields
        const parseJsonField = <T,>(field: any): T | undefined => {
            if (!field) return undefined;
            if (typeof field === 'string') {
                try { return JSON.parse(field); } catch { return undefined; }
            }
            return field as T;
        };

        return {
            id: author.id,
            name: author.name,
            slug: author.slug,
            role: author.role || '',
            avatar: author.imageUrl || author.avatarUrl,
            bio: author.bio,
            // キャリアデータ
            careerStartYear: author.careerStartYear,
            teachingStartYear: author.teachingStartYear,
            totalStudentsTaught: author.totalStudentsTaught,
            graduatesCount: author.graduatesCount,
            weeklyLessons: author.weeklyLessons,
            certifications: parseJsonField<Certification[]>(author.certifications),
            episodes: parseJsonField<Episode[]>(author.episodes),
            signaturePhrases: parseJsonField<string[]>(author.signaturePhrases),
            specialties: parseJsonField<string[]>(author.specialties),
            // 新しいパーソナリティフィールド
            writingStyle: author.writingStyle as Profile['writingStyle'],
            philosophy: author.philosophy,
            avoidWords: parseJsonField<string[]>(author.avoidWords),
            targetAudience: author.targetAudience,
            teachingApproach: author.teachingApproach,
            influences: parseJsonField<string[]>(author.influences),
            locationContext: author.locationContext,
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
            name: '', slug: '', role: '', bio: '', avatar: '',
            // キャリアデータ
            careerStartYear: undefined,
            teachingStartYear: undefined,
            totalStudentsTaught: undefined,
            graduatesCount: undefined,
            weeklyLessons: undefined,
            certifications: [],
            episodes: [],
            signaturePhrases: [],
            specialties: [],
            // パーソナリティ
            writingStyle: undefined,
            philosophy: '',
            avoidWords: [],
            targetAudience: '',
            teachingApproach: '',
            influences: [],
            locationContext: '',
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
            imageUrl: getImageUrl(),
            bio: cleanString(formData.bio),
            // キャリアデータ
            careerStartYear: formData.careerStartYear || undefined,
            teachingStartYear: formData.teachingStartYear || undefined,
            totalStudentsTaught: formData.totalStudentsTaught || undefined,
            graduatesCount: formData.graduatesCount || undefined,
            weeklyLessons: formData.weeklyLessons || undefined,
            certifications: formData.certifications?.length ? formData.certifications : undefined,
            episodes: formData.episodes?.length ? formData.episodes : undefined,
            signaturePhrases: formData.signaturePhrases?.length ? formData.signaturePhrases : undefined,
            specialties: formData.specialties?.length ? formData.specialties : undefined,
            // パーソナリティ
            writingStyle: formData.writingStyle || undefined,
            philosophy: cleanString(formData.philosophy),
            avoidWords: formData.avoidWords?.length ? formData.avoidWords : undefined,
            targetAudience: cleanString(formData.targetAudience),
            teachingApproach: cleanString(formData.teachingApproach),
            influences: formData.influences?.length ? formData.influences : undefined,
            locationContext: cleanString(formData.locationContext),
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
                            <th className="px-4 py-2.5 bg-neutral-50/80 text-xs text-neutral-500 font-medium border-b border-neutral-200 border-r border-neutral-100/50 w-[120px]">資格数</th>
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
                                                createAuthor.mutate({
                                                    name: `${profile.name} (コピー)`,
                                                    slug: `${profile.slug}-copy-${Date.now()}`,
                                                    role: profile.role,
                                                    imageUrl: profile.avatar || undefined,
                                                    bio: profile.bio,
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
                                    <div className="text-xs text-neutral-600">
                                        {profile.certifications?.length || 0}件
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
                <DialogContent className="!w-[950px] !max-w-[950px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? '監修者を編集' : '新しい監修者を追加'}</DialogTitle>
                        <DialogDescription>
                            AI記事生成の品質を高めるため、詳細な情報を入力してください。
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="basic" className="text-xs">基本情報</TabsTrigger>
                            <TabsTrigger value="career" className="text-xs">キャリア・資格</TabsTrigger>
                            <TabsTrigger value="personality" className="text-xs">パーソナリティ</TabsTrigger>
                        </TabsList>

                        {/* 基本情報タブ */}
                        <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                {/* 左カラム: プロフィール写真と基本情報 */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-24 flex flex-col items-center gap-2 pt-1 shrink-0">
                                            <Avatar className="h-24 w-24 border border-neutral-200">
                                                <AvatarImage src={formData.avatar} />
                                                <AvatarFallback className="text-xl bg-neutral-50">
                                                    {formData.name ? formData.name.slice(0, 2) : <User />}
                                                </AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="avatar-upload" className={cn(
                                                "text-[10px] text-center cursor-pointer hover:underline",
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
                                        <div className="flex-1 space-y-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="name" className="text-xs">名前 <span className="text-red-500">*</span></Label>
                                                <Input id="name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-8 text-sm" placeholder="例: 山田 花子" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="slug" className="text-xs">スラグ (URL用ID)</Label>
                                                <Input id="slug" value={formData.slug || ''} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="h-8 text-sm font-mono" placeholder="例: hanako-yamada" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="role" className="text-xs">肩書き</Label>
                                                <Input id="role" value={formData.role || ''} onChange={e => setFormData({ ...formData, role: e.target.value })} className="h-8 text-sm" placeholder="例: ヨガインストラクター" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="locationContext" className="text-xs">活動拠点</Label>
                                        <Input
                                            id="locationContext"
                                            value={formData.locationContext || ''}
                                            onChange={e => setFormData({ ...formData, locationContext: e.target.value })}
                                            className="h-8 text-sm"
                                            placeholder="例: 東京・渋谷区を中心に活動"
                                        />
                                    </div>
                                </div>

                                {/* 右カラム: 自己紹介文 */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="bio" className="text-xs">自己紹介文（記事に使用されます）</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio || ''}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        className="text-sm min-h-[200px]"
                                        placeholder="読者に向けた自己紹介メッセージを入力してください。経歴や想いなど。"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* キャリアタブ */}
                        <TabsContent value="career" className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-700">
                                    <Calendar className="inline mr-1" size={12} />
                                    具体的な数字を入力することで、AIがより信頼性の高い記事を生成します。
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* 左カラム: キャリアデータと資格 */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="careerStartYear" className="text-xs flex items-center gap-1">
                                                <Calendar size={12} /> ヨガ開始年
                                            </Label>
                                            <Input
                                                id="careerStartYear"
                                                type="number"
                                                min="1950"
                                                max={new Date().getFullYear()}
                                                value={formData.careerStartYear || ''}
                                                onChange={e => setFormData({ ...formData, careerStartYear: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="h-8 text-sm"
                                                placeholder="例: 2005"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="teachingStartYear" className="text-xs flex items-center gap-1">
                                                <GraduationCap size={12} /> 指導開始年
                                            </Label>
                                            <Input
                                                id="teachingStartYear"
                                                type="number"
                                                min="1950"
                                                max={new Date().getFullYear()}
                                                value={formData.teachingStartYear || ''}
                                                onChange={e => setFormData({ ...formData, teachingStartYear: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="h-8 text-sm"
                                                placeholder="例: 2010"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="totalStudentsTaught" className="text-xs flex items-center gap-1">
                                                <Users size={12} /> 累計指導人数
                                            </Label>
                                            <Input
                                                id="totalStudentsTaught"
                                                type="number"
                                                min="0"
                                                value={formData.totalStudentsTaught || ''}
                                                onChange={e => setFormData({ ...formData, totalStudentsTaught: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="h-8 text-sm"
                                                placeholder="例: 5000"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="graduatesCount" className="text-xs flex items-center gap-1">
                                                <GraduationCap size={12} /> 養成講座卒業生
                                            </Label>
                                            <Input
                                                id="graduatesCount"
                                                type="number"
                                                min="0"
                                                value={formData.graduatesCount || ''}
                                                onChange={e => setFormData({ ...formData, graduatesCount: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="h-8 text-sm"
                                                placeholder="例: 200"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="weeklyLessons" className="text-xs flex items-center gap-1">
                                                <BookOpen size={12} /> 週レッスン数
                                            </Label>
                                            <Input
                                                id="weeklyLessons"
                                                type="number"
                                                min="0"
                                                value={formData.weeklyLessons || ''}
                                                onChange={e => setFormData({ ...formData, weeklyLessons: e.target.value ? parseInt(e.target.value) : undefined })}
                                                className="h-8 text-sm"
                                                placeholder="例: 15"
                                            />
                                        </div>
                                    </div>

                                    {/* 専門分野 */}
                                    <div className="space-y-1.5 pt-2 border-t">
                                        <Label htmlFor="specialties" className="text-xs">専門・得意分野（カンマ区切り）</Label>
                                        <Input
                                            id="specialties"
                                            value={formData.specialties?.join(', ') || ''}
                                            onChange={e => setFormData({ ...formData, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            className="h-8 text-sm"
                                            placeholder="例: マタニティヨガ, シニアヨガ"
                                        />
                                    </div>

                                    {/* 資格情報 */}
                                    <div className="space-y-3 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">保有資格</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => setFormData({
                                            ...formData,
                                            certifications: [...(formData.certifications || []), { name: '', year: undefined, location: '' }]
                                        })}
                                    >
                                        <Plus size={12} className="mr-1" /> 資格を追加
                                    </Button>
                                </div>
                                {(formData.certifications || []).map((cert, idx) => (
                                    <div key={idx} className="flex gap-2 items-start p-2 bg-neutral-50 rounded">
                                        <div className="flex-1 space-y-1">
                                            <Input
                                                value={cert.name}
                                                onChange={e => {
                                                    const newCerts = [...(formData.certifications || [])];
                                                    newCerts[idx] = { ...newCerts[idx], name: e.target.value };
                                                    setFormData({ ...formData, certifications: newCerts });
                                                }}
                                                className="h-7 text-sm"
                                                placeholder="資格名 (例: RYT200)"
                                            />
                                            <div className="grid grid-cols-2 gap-1">
                                                <Input
                                                    type="number"
                                                    value={cert.year || ''}
                                                    onChange={e => {
                                                        const newCerts = [...(formData.certifications || [])];
                                                        newCerts[idx] = { ...newCerts[idx], year: e.target.value ? parseInt(e.target.value) : undefined };
                                                        setFormData({ ...formData, certifications: newCerts });
                                                    }}
                                                    className="h-7 text-sm"
                                                    placeholder="取得年"
                                                />
                                                <Input
                                                    value={cert.location || ''}
                                                    onChange={e => {
                                                        const newCerts = [...(formData.certifications || [])];
                                                        newCerts[idx] = { ...newCerts[idx], location: e.target.value };
                                                        setFormData({ ...formData, certifications: newCerts });
                                                    }}
                                                    className="h-7 text-sm"
                                                    placeholder="取得場所"
                                                />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                                            onClick={() => setFormData({ ...formData, certifications: (formData.certifications || []).filter((_, i) => i !== idx) })}>
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                ))}
                                    </div>
                                </div>

                                {/* 右カラム: エピソード、フレーズ */}
                                <div className="space-y-4">
                                    {/* エピソード */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">経験エピソード</Label>
                                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                                onClick={() => setFormData({ ...formData, episodes: [...(formData.episodes || []), { type: 'transformation', title: '', content: '' }] })}>
                                                <Plus size={12} className="mr-1" /> 追加
                                            </Button>
                                        </div>
                                        {(formData.episodes || []).map((ep, idx) => (
                                            <div key={idx} className="p-2 bg-neutral-50 rounded space-y-1">
                                                <div className="flex gap-1 items-center">
                                                    <select value={ep.type} onChange={e => {
                                                        const newEps = [...(formData.episodes || [])];
                                                        newEps[idx] = { ...newEps[idx], type: e.target.value as Episode['type'] };
                                                        setFormData({ ...formData, episodes: newEps });
                                                    }} className="h-7 text-xs border rounded px-1 bg-white">
                                                        <option value="transformation">自身の変化</option>
                                                        <option value="student">生徒の変化</option>
                                                        <option value="teaching">指導での気づき</option>
                                                        <option value="other">その他</option>
                                                    </select>
                                                    <Input value={ep.title} onChange={e => {
                                                        const newEps = [...(formData.episodes || [])];
                                                        newEps[idx] = { ...newEps[idx], title: e.target.value };
                                                        setFormData({ ...formData, episodes: newEps });
                                                    }} className="flex-1 h-7 text-sm" placeholder="タイトル" />
                                                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                                                        onClick={() => setFormData({ ...formData, episodes: (formData.episodes || []).filter((_, i) => i !== idx) })}>
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </div>
                                                <Textarea value={ep.content} onChange={e => {
                                                    const newEps = [...(formData.episodes || [])];
                                                    newEps[idx] = { ...newEps[idx], content: e.target.value };
                                                    setFormData({ ...formData, episodes: newEps });
                                                }} className="text-sm min-h-[60px]" placeholder="エピソード内容..." />
                                            </div>
                                        ))}
                                    </div>

                                    {/* よく使うフレーズ */}
                                    <div className="space-y-2 pt-2 border-t">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">よく使うフレーズ</Label>
                                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                                onClick={() => setFormData({ ...formData, signaturePhrases: [...(formData.signaturePhrases || []), ''] })}>
                                                <Plus size={12} className="mr-1" /> 追加
                                            </Button>
                                        </div>
                                        {(formData.signaturePhrases || []).map((phrase, idx) => (
                                            <div key={idx} className="flex gap-1 items-center">
                                                <Input value={phrase} onChange={e => {
                                                    const newPhrases = [...(formData.signaturePhrases || [])];
                                                    newPhrases[idx] = e.target.value;
                                                    setFormData({ ...formData, signaturePhrases: newPhrases });
                                                }} className="h-7 text-sm" placeholder="例: 呼吸を大切に" />
                                                <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                                                    onClick={() => setFormData({ ...formData, signaturePhrases: (formData.signaturePhrases || []).filter((_, i) => i !== idx) })}>
                                                    <Trash2 size={12} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* パーソナリティタブ */}
                        <TabsContent value="personality" className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-xs text-purple-700">
                                    <Sparkles className="inline mr-1" size={12} />
                                    パーソナリティ設定は、AI検知を下げ「この人らしさ」を出すために重要です。
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* 左カラム: 文体と理念 */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="writingStyle" className="text-xs">文体スタイル</Label>
                                        <select
                                            id="writingStyle"
                                            value={formData.writingStyle || ''}
                                            onChange={e => setFormData({ ...formData, writingStyle: e.target.value as Profile['writingStyle'] || undefined })}
                                            className="w-full h-8 text-sm border rounded px-2 bg-white"
                                        >
                                            <option value="">選択してください</option>
                                            <option value="formal">丁寧・フォーマル</option>
                                            <option value="casual">親しみやすい・カジュアル</option>
                                            <option value="professional">専門的・プロフェッショナル</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="philosophy" className="text-xs">指導理念・信念</Label>
                                        <Textarea
                                            id="philosophy"
                                            value={formData.philosophy || ''}
                                            onChange={e => setFormData({ ...formData, philosophy: e.target.value })}
                                            className="text-sm min-h-[120px]"
                                            placeholder="なぜヨガを教えるのか、大切にしていることなど"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="targetAudience" className="text-xs">主な指導対象</Label>
                                        <Input
                                            id="targetAudience"
                                            value={formData.targetAudience || ''}
                                            onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                                            className="h-8 text-sm"
                                            placeholder="例: 20〜40代の働く女性、シニア層、初心者"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="teachingApproach" className="text-xs">指導スタイル</Label>
                                        <Input
                                            id="teachingApproach"
                                            value={formData.teachingApproach || ''}
                                            onChange={e => setFormData({ ...formData, teachingApproach: e.target.value })}
                                            className="h-8 text-sm"
                                            placeholder="例: 寄り添い型、理論重視、実践重視"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="influences" className="text-xs">影響を受けた先生・流派（カンマ区切り）</Label>
                                        <Input
                                            id="influences"
                                            value={formData.influences?.join(', ') || ''}
                                            onChange={e => setFormData({ ...formData, influences: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                            className="h-8 text-sm"
                                            placeholder="例: 綿本彰, アイアンガーヨガ"
                                        />
                                    </div>
                                </div>

                                {/* 右カラム: 使わない言葉 */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">使わない言葉・表現（AIっぽさを避ける）</Label>
                                        <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                                            onClick={() => setFormData({ ...formData, avoidWords: [...(formData.avoidWords || []), ''] })}>
                                            <Plus size={12} className="mr-1" /> 追加
                                        </Button>
                                    </div>
                                    {(formData.avoidWords || []).map((word, idx) => (
                                        <div key={idx} className="flex gap-1 items-center">
                                            <Input value={word} onChange={e => {
                                                const newWords = [...(formData.avoidWords || [])];
                                                newWords[idx] = e.target.value;
                                                setFormData({ ...formData, avoidWords: newWords });
                                            }} className="h-7 text-sm" placeholder="例: 是非、まさに、実際に" />
                                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                                                onClick={() => setFormData({ ...formData, avoidWords: (formData.avoidWords || []).filter((_, i) => i !== idx) })}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {['是非', 'まさに', '実際に', 'いかがでしょうか', '〜と言えるでしょう'].map((word) => (
                                            <button key={word} type="button"
                                                className="text-[10px] px-1.5 py-0.5 bg-white border border-neutral-200 rounded hover:bg-neutral-100"
                                                onClick={() => {
                                                    if (!(formData.avoidWords || []).includes(word)) {
                                                        setFormData({ ...formData, avoidWords: [...(formData.avoidWords || []), word] });
                                                    }
                                                }}>
                                            + {word}
                                        </button>
                                    ))}
                                </div>
                                </div>
                            </div>

                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-4">
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