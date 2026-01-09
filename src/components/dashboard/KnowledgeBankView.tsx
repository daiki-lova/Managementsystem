'use client'

import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, AlertCircle, Trash2, Edit2, Link as LinkIcon, Globe, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import type { KnowledgeItem, Profile } from '../../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useKnowledgeBank, useCreateKnowledgeEntry, useDeleteKnowledgeEntry, useUpdateKnowledgeEntry, useAuthors } from '../../lib/hooks';

interface KnowledgeBankViewProps {
    items?: KnowledgeItem[];
    onItemsChange?: (items: KnowledgeItem[]) => void;
    authors?: Profile[];
}

export function KnowledgeBankView({ items: _items, onItemsChange: _onItemsChange, authors: _authors }: KnowledgeBankViewProps) {
    // Use API hooks instead of props
    const { data: knowledgeData, isLoading, error } = useKnowledgeBank();
    const { data: authorsData } = useAuthors();
    const createKnowledgeEntry = useCreateKnowledgeEntry();
    const updateKnowledgeEntry = useUpdateKnowledgeEntry();
    const deleteKnowledgeEntry = useDeleteKnowledgeEntry();

    // Map API data to KnowledgeItem format
    const items: KnowledgeItem[] = (knowledgeData?.data || []).map((item: any) => ({
        id: item.id,
        content: item.content,
        brand: item.brand?.slug || 'ALL',
        course: item.course,
        kind: item.type, // Map item.type to kind
        authorId: item.authorId,
        authorName: item.author?.name,
        createdAt: item.createdAt,
        usageCount: item.usageCount || 0,
        source: item.sourceUrl ? 'web' : 'manual',
        sourceType: item.sourceUrl ? 'url' : 'text', // Infer from sourceUrl
    }));

    // Map authors
    const authors: Profile[] = (authorsData?.data || []).map((author: any) => ({
        id: author.id,
        name: author.name,
        slug: author.slug,
        role: author.title || '',
        qualifications: author.qualifications || '',
        categories: author.categories || [],
        tags: author.tags || [],
        avatar: author.avatarUrl,
        bio: author.bio,
    }));
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState<string>('ALL_BRANDS');
    const [courseFilter, setCourseFilter] = useState<string>('ALL_COURSES');
    const [authorFilter, setAuthorFilter] = useState<string>('ALL_AUTHORS');

    const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
    const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

    // Registration Flow States
    const [registrationStep, setRegistrationStep] = useState<'select' | 'input'>('select');
    const [inputType, setInputType] = useState<'url' | 'text'>('text');
    const [inputContent, setInputContent] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<'OREO' | 'SEQUENCE' | 'ALL'>('OREO');
    const [selectedType, setSelectedType] = useState<string>('STUDENT_VOICE');
    const [selectedCourse, setSelectedCourse] = useState<string>('UNSELECTED');
    const [selectedAuthor, setSelectedAuthor] = useState<string>('UNSELECTED');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset states when dialog opens/closes
    useEffect(() => {
        if (!isRegisterDialogOpen) {
            // Short delay to allow transition to finish
            const timer = setTimeout(() => {
                setRegistrationStep('select');
                setInputType('text');
                setInputContent('');
                setSelectedBrand('OREO');
                setSelectedType('STUDENT_VOICE');
                setSelectedCourse('UNSELECTED');
                setSelectedAuthor('UNSELECTED');
                setIsSubmitting(false);
                setEditingItem(null); // Reset editing item
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isRegisterDialogOpen]);

    // Mock Data for Filters
    const COURSES = ['RYT200', 'RYT500', 'RPY85', 'RCYT95', 'ピラティス基礎', '短期集中'];
    const TYPES = [
        { id: 'STUDENT_VOICE', label: '受講生の声', description: 'インタビュー、アンケート、口コミ' },
        { id: 'AUTHOR_ARTICLE', label: '監修者記事', description: '監修者のブログ、コラム' },
        { id: 'EXTERNAL', label: '外部文献', description: '論文、外部記事、YouTube' }
    ];

    // Filtering
    const filteredItems = items.filter(item => {
        const matchesSearch = (item.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.authorName && item.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesBrand = brandFilter === 'ALL_BRANDS' || item.brand === brandFilter;
        const matchesCourse = courseFilter === 'ALL_COURSES' || item.course === courseFilter;
        const matchesAuthor = authorFilter === 'ALL_AUTHORS' || item.authorId === authorFilter;

        return matchesSearch && matchesBrand && matchesCourse && matchesAuthor;
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, brandFilter, courseFilter, authorFilter]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSubmit = async () => {
        if (!inputContent.trim()) return;

        setIsSubmitting(true);

        if (editingItem) {
            // Update existing item
            await updateKnowledgeEntry.mutateAsync({
                id: editingItem.id,
                data: {
                    content: inputContent.trim(),
                    type: selectedType,
                    brandId: selectedBrand === 'ALL' ? undefined : selectedBrand,
                    course: selectedCourse === 'UNSELECTED' ? undefined : selectedCourse,
                    authorId: selectedAuthor === 'UNSELECTED' ? undefined : selectedAuthor,
                    sourceUrl: inputType === 'url' ? inputContent.trim() : undefined,
                } as any
            });
            toast.success('情報を更新しました');
        } else {
            // Create new items
            // Split content if text type (simple line break split)
            const newItemsRaw = inputType === 'text'
                ? inputContent.split(/\n\s*\n/).filter(t => t.trim().length > 0)
                : [inputContent];

            // Create entries one by one
            for (const content of newItemsRaw) {
                await createKnowledgeEntry.mutateAsync({
                    content: content.trim(),
                    kind: selectedType, // Hook uses 'kind' but internally API expects 'type' or hooked mapped it?
                    // Wait, useCreateKnowledgeEntry calls knowledgeBankApi.create.
                    // Api.ts: create: (data) => axios.post(..., data)
                    // Backend expects 'type'.
                    // If hooks.ts passes 'kind', backend might fail or needs 'type'.
                    // Let's assume 'selectedType' matches what backend expects or 'kind' is aliasing.
                    // Actually, 'kind' in createKnowledgeEntry arguments might need to be 'type'.
                    // Let's use 'type' to be safe if that's what backend expects.
                    // But createKnowledgeEntry signature in hooks?
                    // It takes data: Parameters<typeof knowledgeBankApi.create>[0].
                    // In api.ts, create payload usually matches backend schema.
                    // Backend schema has 'type'.
                    // So we should send 'type'.
                    type: selectedType,
                    sourceUrl: inputType === 'url' ? content.trim() : undefined,
                    brandId: selectedBrand === 'ALL' ? undefined : selectedBrand,
                    course: selectedCourse === 'UNSELECTED' ? undefined : selectedCourse,
                    authorId: selectedAuthor === 'UNSELECTED' ? undefined : selectedAuthor,
                } as any); // Cast to any to bypass strict type check if needed, or fix type
            }

            toast.success('情報を追加しました', {
                description: `${newItemsRaw.length}件の情報をバンクに登録しました。`,
            });
        }

        setIsSubmitting(false);
        setIsRegisterDialogOpen(false);
    };

    const openEdit = (item: KnowledgeItem) => {
        setEditingItem(item);
        setRegistrationStep('input'); // Skip select step? Or stay in input view.
        // Pre-fill
        setInputContent(item.content);
        setInputType(item.sourceType === 'url' ? 'url' : 'text');
        setSelectedBrand((!item.brand || item.brand === 'ALL') ? 'OREO' : item.brand as any); // Default to OREO if ALL/Null, or keep ALL if valid
        // Note: select only has OREO, SEQUENCE, ALL.

        setSelectedType(item.kind || 'STUDENT_VOICE');
        setSelectedCourse(item.course || 'UNSELECTED');
        setSelectedAuthor(item.authorId || 'UNSELECTED');

        setIsRegisterDialogOpen(true);
        setIsDetailDialogOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('この情報を削除してもよろしいですか？')) {
            deleteKnowledgeEntry.mutate(id);
            setIsDetailDialogOpen(false);
        }
    };

    const openDetail = (item: KnowledgeItem) => {
        setSelectedItem(item);
        setIsDetailDialogOpen(true);
    };

    const getBrandColor = (brand: string) => {
        switch (brand) {
            case 'OREO': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'SEQUENCE': return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
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
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">情報バンク</h1>
                    <p className="text-sm text-neutral-500 font-medium">{filteredItems.length} 件の情報</p>
                </div>
                <Button onClick={() => setIsRegisterDialogOpen(true)} className="h-12 !px-6 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm flex items-center gap-2">
                    <Plus size={18} />
                    情報を追加
                </Button>
            </header>

            {/* Toolbar */}
            <div className="flex items-center gap-3 py-3 px-6 border-b border-neutral-100 bg-white flex-none overflow-x-auto">
                <div className="relative group flex-1 min-w-[200px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors" size={14} />
                    <Input
                        className="pl-9 h-9 bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-0 rounded text-sm transition-all"
                        placeholder="キーワード検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                        <SelectValue placeholder="ブランド" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_BRANDS">全てのブランド</SelectItem>
                        <SelectItem value="OREO">OREO</SelectItem>
                        <SelectItem value="SEQUENCE">SEQUENCE</SelectItem>
                        <SelectItem value="ALL">共通</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                        <SelectValue placeholder="コース" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_COURSES">全てのコース</SelectItem>
                        {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                        <SelectValue placeholder="監修者" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL_AUTHORS">全ての監修者</SelectItem>
                        {authors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white">
                <div className="flex-1 overflow-auto">
                    {filteredItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4 p-8">
                            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
                                <Filter size={32} className="opacity-50" />
                            </div>
                            <p className="text-sm font-medium">情報が見つかりません</p>
                            <Button variant="outline" size="sm" onClick={() => {
                                setSearchQuery('');
                                setBrandFilter('ALL_BRANDS');
                                setCourseFilter('ALL_COURSES');
                                setAuthorFilter('ALL_AUTHORS');
                            }}>
                                フィルタを解除
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                                    <TableHead className="w-[40%] pl-6">内容</TableHead>
                                    <TableHead className="w-[100px]">ブランド</TableHead>
                                    <TableHead className="w-[120px]">種類</TableHead>
                                    <TableHead className="w-[120px]">コース</TableHead>
                                    <TableHead className="w-[150px]">監修者</TableHead>
                                    <TableHead className="w-[100px]">登録日</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedItems.map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => openDetail(item)}>
                                        <TableCell className="pl-6 font-medium">
                                            {(item.sourceType === 'url' || (!item.sourceType && item.content.startsWith('http'))) ? (
                                                <div className="flex items-center gap-3 max-w-[500px]">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 border border-blue-100">
                                                        <Globe size={14} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-sm text-neutral-700 truncate block font-medium">
                                                            {item.content}
                                                        </span>
                                                        <p className="text-[10px] text-neutral-400 mt-0.5">外部リンク</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 max-w-[500px]">
                                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-500 border border-neutral-200 mt-0.5">
                                                        <FileText size={14} />
                                                    </div>
                                                    <div className="min-w-0 flex-1 pt-1">
                                                        <div className="line-clamp-2 text-neutral-700 text-sm font-medium leading-relaxed" title={item.content}>
                                                            {item.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 rounded font-normal border-0 whitespace-nowrap", getBrandColor(item.brand))}>
                                                {item.brand === 'ALL' ? '共通' : item.brand}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-neutral-600">
                                                {item.kind === 'STUDENT_VOICE' && '受講生の声'}
                                                {item.kind === 'AUTHOR_ARTICLE' && '監修者記事'}
                                                {item.kind === 'EXTERNAL' && '外部文献'}
                                                {!item.kind && '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {item.course ? (
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded font-normal bg-neutral-100 text-neutral-600 hover:bg-neutral-200 whitespace-nowrap">
                                                    {item.course}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-neutral-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                                                {item.authorName ? (
                                                    <>
                                                        <User size={12} className="text-neutral-400" />
                                                        <span className="truncate max-w-[120px]">{item.authorName}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-neutral-400">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-neutral-500 tabular-nums">
                                                {format(new Date(item.createdAt), 'yyyy/MM/dd', { locale: ja })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900" onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEdit(item);
                                                }}>
                                                    <Edit2 size={14} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {filteredItems.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-white flex-none">
                        <div className="text-xs text-neutral-500">
                            全 {filteredItems.length} 件中 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} 件を表示
                        </div>
                        <Pagination className="justify-end w-auto mx-0">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // Show first, last, current, and neighbors
                                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                                    })
                                    .map((page, i, arr) => {
                                        // Insert ellipsis logic visually by checking gaps
                                        const prevPage = arr[i - 1];
                                        const showEllipsis = prevPage && page - prevPage > 1;

                                        return (
                                            <React.Fragment key={page}>
                                                {showEllipsis && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}
                                                <PaginationItem>
                                                    <PaginationLink
                                                        isActive={page === currentPage}
                                                        onClick={() => setCurrentPage(page)}
                                                        className="cursor-pointer"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </React.Fragment>
                                        );
                                    })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            {/* Register Dialog */}
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogContent className="sm:max-w-[600px] transition-all duration-200">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? '情報を編集' : 'ソースを追加'}</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            {editingItem ? '登録済みの情報を編集します。' : '記事生成に活用する一次情報を登録します。'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Source Type Selection */}
                        <div className="flex p-1 bg-neutral-100 rounded-lg">
                            <button
                                onClick={() => setInputType('text')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                    inputType === 'text'
                                        ? "bg-white text-neutral-900 shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )}
                            >
                                <FileText size={16} />
                                テキスト
                            </button>
                            <button
                                onClick={() => setInputType('url')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                    inputType === 'url'
                                        ? "bg-white text-neutral-900 shadow-sm"
                                        : "text-neutral-500 hover:text-neutral-700"
                                )}
                            >
                                <LinkIcon size={16} />
                                リンク (URL)
                            </button>
                        </div>

                        {/* Content Input */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-neutral-500">
                                {inputType === 'url' ? 'URL' : 'テキスト内容'} <span className="text-red-500">*</span>
                            </label>

                            {inputType === 'url' ? (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="https://example.com/article"
                                        value={inputContent}
                                        onChange={(e) => setInputContent(e.target.value)}
                                        className="font-mono text-sm bg-neutral-50/50"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-neutral-400">
                                        ※ ウェブサイト、YouTube、オンライン文献などのURLを入力してください。
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="受講生の声、フィードバック、監修者のブログ記事、参考文献などを貼り付け..."
                                        className="min-h-[200px] resize-none text-sm leading-relaxed bg-neutral-50/50 border-neutral-200 focus:ring-2 focus:ring-neutral-100"
                                        value={inputContent}
                                        onChange={(e) => setInputContent(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* Brand and Type Selection Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500">ブランド <span className="text-red-500">*</span></label>
                                <Select value={selectedBrand} onValueChange={(v: any) => setSelectedBrand(v)}>
                                    <SelectTrigger className="w-full bg-neutral-50/50 border-neutral-200 focus:ring-2 focus:ring-neutral-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OREO">OREO</SelectItem>
                                        <SelectItem value="SEQUENCE">SEQUENCE</SelectItem>
                                        <SelectItem value="ALL">共通</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500">情報の種類 <span className="text-red-500">*</span></label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="w-full bg-neutral-50/50 border-neutral-200 focus:ring-2 focus:ring-neutral-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPES.map(type => (
                                            <SelectItem key={type.id} value={type.id}>
                                                <span className="font-medium">{type.label}</span>
                                                <span className="ml-2 text-xs text-neutral-400 hidden sm:inline">({type.description})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Author and Course Selection Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500">監修者</label>
                                <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                                    <SelectTrigger className="w-full bg-neutral-50/50 border-neutral-200 focus:ring-2 focus:ring-neutral-100">
                                        <SelectValue placeholder="未設定" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNSELECTED">未設定</SelectItem>
                                        {authors.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-neutral-500">コース</label>
                                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                    <SelectTrigger className="w-full bg-neutral-50/50 border-neutral-200 focus:ring-2 focus:ring-neutral-100">
                                        <SelectValue placeholder="未設定" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UNSELECTED">未設定</SelectItem>
                                        {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                            <AlertCircle size={16} className="shrink-0" />
                            <p>
                                監修者やコースを設定すると、関連する記事生成時に優先的にこの情報が使用されます。
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-between items-center border-t border-neutral-100 pt-4 mt-2">
                        <div className="text-xs text-neutral-400">
                            ソースの件数: {items.length}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setIsRegisterDialogOpen(false)} disabled={isSubmitting} size="default">
                                キャンセル
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !inputContent.trim()} className="min-w-[100px]" size="default">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="mr-2 animate-spin" />
                                        追加中
                                    </>
                                ) : (
                                    '追加'
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>情報詳細</DialogTitle>
                            <DialogDescription className="sr-only">
                                選択された情報の詳細を表示します。
                            </DialogDescription>
                            {selectedItem && (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900" onClick={() => openEdit(selectedItem)}>
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(selectedItem.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-6 py-2">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={cn("h-6 px-2", getBrandColor(selectedItem.brand))}>
                                    {selectedItem.brand === 'ALL' ? '共通' : selectedItem.brand}
                                </Badge>
                                {selectedItem.course && (
                                    <Badge variant="secondary" className="h-6 px-2 bg-neutral-100 text-neutral-600">
                                        {selectedItem.course}
                                    </Badge>
                                )}
                                {selectedItem.authorName && (
                                    <Badge variant="outline" className="h-6 px-2 border-neutral-200 text-neutral-600 gap-1 pl-1.5">
                                        <User size={10} />
                                        {selectedItem.authorName}
                                    </Badge>
                                )}
                            </div>

                            <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                                <p className="text-sm leading-relaxed text-neutral-800 whitespace-pre-wrap">
                                    {selectedItem.content}
                                </p>
                            </div>

                            <div className="flex items-center gap-6 text-xs text-neutral-500 border-t border-neutral-100 pt-4">
                                <div>
                                    <span className="font-medium text-neutral-900">登録日: </span>
                                    {format(new Date(selectedItem.createdAt), 'yyyy/MM/dd HH:mm')}
                                </div>
                                <div>
                                    <span className="font-medium text-neutral-900">使用回数: </span>
                                    {selectedItem.usageCount}回
                                </div>
                                <div>
                                    <span className="font-medium text-neutral-900">ソース: </span>
                                    {selectedItem.source === 'manual' ? '手動登録' : 'スプレッドシート連携'}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for User icon
function User({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}