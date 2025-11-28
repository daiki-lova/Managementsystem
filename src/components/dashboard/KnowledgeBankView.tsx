import React, { useState } from 'react';
import { Search, Plus, Filter, FileSpreadsheet, Type, Check, AlertCircle, MoreVertical, Trash2, Edit2, Calendar, RefreshCw, Link } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import type { KnowledgeItem, Profile } from '../../types';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface KnowledgeBankViewProps {
    items?: KnowledgeItem[];
    onItemsChange?: (items: KnowledgeItem[]) => void;
    authors?: Profile[];
}

export function KnowledgeBankView({ items = [], onItemsChange, authors = [] }: KnowledgeBankViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState<string>('ALL_BRANDS');
    const [courseFilter, setCourseFilter] = useState<string>('ALL_COURSES');
    const [authorFilter, setAuthorFilter] = useState<string>('ALL_AUTHORS');
    
    const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
    
    // Registration Form States
    const [activeTab, setActiveTab] = useState('text');
    const [textInputBrand, setTextInputBrand] = useState<'OREO' | 'SEQUENCE' | 'ALL'>('OREO');
    const [textInputContent, setTextInputContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Spreadsheet Form States
    const [sheetUrl, setSheetUrl] = useState('');
    const [isLinked, setIsLinked] = useState(false);

    // Mock Data for Filters
    const COURSES = ['RYT200', 'RYT500', 'RPY85', 'RCYT95', 'ピラティス基礎', '短期集中'];

    // Filtering
    const filteredItems = items.filter(item => {
        const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (item.authorName && item.authorName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesBrand = brandFilter === 'ALL_BRANDS' || item.brand === brandFilter;
        const matchesCourse = courseFilter === 'ALL_COURSES' || item.course === courseFilter;
        const matchesAuthor = authorFilter === 'ALL_AUTHORS' || item.authorId === authorFilter;

        return matchesSearch && matchesBrand && matchesCourse && matchesAuthor;
    });

    const handleTextSubmit = async () => {
        if (!textInputContent.trim()) return;
        
        setIsSubmitting(true);
        
        // Mock processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newItemsRaw = textInputContent.split(/\n\s*\n/).filter(t => t.trim().length > 0);
        
        const newKnowledgeItems: KnowledgeItem[] = newItemsRaw.map(content => ({
            id: Math.random().toString(36).substr(2, 9),
            content: content.trim(),
            brand: textInputBrand,
            // Randomly assign mock data for demo purposes since we don't have backend extraction
            course: COURSES[Math.floor(Math.random() * COURSES.length)],
            authorId: authors.length > 0 ? authors[Math.floor(Math.random() * authors.length)].id : undefined,
            authorName: authors.length > 0 ? authors[Math.floor(Math.random() * authors.length)].name : undefined,
            createdAt: new Date().toISOString(),
            usageCount: 0,
            source: 'manual'
        }));
        
        onItemsChange?.([...newKnowledgeItems, ...items]); // Add to top
        setIsSubmitting(false);
        setIsRegisterDialogOpen(false);
        setTextInputContent('');
    };

    const handleSheetSync = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsLinked(true);
            // In a real app, this would fetch data
        }, 1500);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('この情報を削除してもよろしいですか？')) {
            onItemsChange?.(items.filter(i => i.id !== id));
            setIsDetailDialogOpen(false);
        }
    };

    const openDetail = (item: KnowledgeItem) => {
        setSelectedItem(item);
        setIsDetailDialogOpen(true);
    };

    const getBrandColor = (brand: string) => {
        switch(brand) {
            case 'OREO': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'SEQUENCE': return 'bg-purple-50 text-purple-700 border-purple-100';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

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
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/50">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                            <div 
                                key={item.id} 
                                className="group bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-[200px]"
                                onClick={() => openDetail(item)}
                            >
                                <div className="p-4 flex-1 overflow-hidden relative">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 rounded font-normal border-0", getBrandColor(item.brand))}>
                                            {item.brand === 'ALL' ? '共通' : item.brand}
                                        </Badge>
                                        {item.course && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 rounded font-normal bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                                                {item.course}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-700 leading-relaxed line-clamp-4">
                                        {item.content}
                                    </p>
                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                </div>
                                <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/30 rounded-b-xl">
                                    <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                                        <span className="flex items-center gap-1">
                                            <User size={10} />
                                            {item.authorName || '-'}
                                        </span>
                                        <span>•</span>
                                        <span>{format(new Date(item.createdAt), 'MM/dd', { locale: ja })}</span>
                                    </div>
                                    <div className="text-[10px] font-medium text-neutral-500">
                                        {item.usageCount}回使用
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Register Dialog */}
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>情報を追加</DialogTitle>
                        <DialogDescription>
                            記事生成に使用する一次情報を登録します。
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="text" className="gap-2"><Type size={14} /> テキスト入力</TabsTrigger>
                            <TabsTrigger value="sheet" className="gap-2"><FileSpreadsheet size={14} /> スプレッドシート連携</TabsTrigger>
                        </TabsList>

                        <TabsContent value="text" className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-xs font-medium text-neutral-700">ブランド</label>
                                <Select value={textInputBrand} onValueChange={(v: any) => setTextInputBrand(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OREO">OREO</SelectItem>
                                        <SelectItem value="SEQUENCE">SEQUENCE</SelectItem>
                                        <SelectItem value="ALL">共通</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-xs font-medium text-neutral-700">
                                    テキスト内容
                                    <span className="ml-2 text-[10px] font-normal text-neutral-400">※複数件ある場合は空行で区切ってください</span>
                                </label>
                                <Textarea 
                                    placeholder="受講生の声、ブログ記事、フィードバックなどを貼り付けてください..." 
                                    className="min-h-[200px] resize-none text-sm leading-relaxed"
                                    value={textInputContent}
                                    onChange={(e) => setTextInputContent(e.target.value)}
                                />
                            </div>
                            <div className="bg-blue-50 text-blue-700 p-3 rounded text-xs flex gap-2 items-start">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <div>
                                    監修者やコース情報は、入力されたテキストからAIが自動的に抽出・推定します。入力は不要です。
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="sheet" className="space-y-6 py-4">
                            {!isLinked ? (
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <label className="text-xs font-medium text-neutral-700">Google スプレッドシート URL</label>
                                        <Input 
                                            placeholder="https://docs.google.com/spreadsheets/d/..." 
                                            value={sheetUrl}
                                            onChange={(e) => setSheetUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-neutral-100 p-4 rounded text-xs space-y-2 text-neutral-600">
                                        <p className="font-bold text-neutral-800">推奨フォーマット:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>A列: 情報本文（必須）</li>
                                            <li>B列: ブランド（OREO / シークエンス / 共通）</li>
                                            <li>C列: ステータス（自動更新されます）</li>
                                        </ul>
                                    </div>
                                    <Button className="w-full" onClick={handleSheetSync} disabled={!sheetUrl || isSubmitting}>
                                        {isSubmitting ? '連携中...' : '連携する'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col items-center text-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                                            <Check size={24} strokeWidth={3} />
                                        </div>
                                        <h3 className="font-bold text-green-800">連携完了</h3>
                                        <p className="text-xs text-green-700 font-medium">OREO受講生の声.xlsx</p>
                                        <div className="text-[10px] text-neutral-400 mt-2">
                                            最終同期: {format(new Date(), 'yyyy/MM/dd HH:mm')}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border border-neutral-100 rounded-lg p-3 text-center">
                                            <div className="text-xs text-neutral-500 mb-1">取り込み済み</div>
                                            <div className="text-xl font-bold text-neutral-900">128</div>
                                        </div>
                                        <div className="border border-neutral-100 rounded-lg p-3 text-center">
                                            <div className="text-xs text-neutral-500 mb-1">未取り込み</div>
                                            <div className="text-xl font-bold text-orange-600">12</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={() => setIsLinked(false)}>連携解除</Button>
                                        <Button className="flex-1" onClick={() => alert('同期を開始します')}>
                                            <RefreshCw size={14} className="mr-2" /> 今すぐ同期
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        {activeTab === 'text' && (
                            <Button onClick={handleTextSubmit} disabled={isSubmitting || !textInputContent.trim()}>
                                {isSubmitting ? '処理中...' : '登録する'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <DialogTitle>情報詳細</DialogTitle>
                            {selectedItem && (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-neutral-900">
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
