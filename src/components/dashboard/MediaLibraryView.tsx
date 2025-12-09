import React, { useState, useMemo } from 'react';
import {
    Image as ImageIcon, Search,
    Loader2, X, FolderOpen, Star, Trash2,
    MoreHorizontal, HardDrive, Plus, Filter,
    Download, ExternalLink, MoveRight, Pencil, Sparkles
} from 'lucide-react';
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { Label } from '../ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter
} from "../ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
} from "../ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from '../ui/scroll-area';
import { useMedia, useUploadMedia, useDeleteMedia } from '../../lib/hooks';

// Media item type
interface MediaItem {
    id: string;
    url: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
    dimensions?: string;
    source: string;
    folder: string;
}

const INITIAL_FOLDERS = [
    { id: 'all', name: 'すべてのメディア', icon: <HardDrive size={16} /> },
    { id: 'class', name: 'レッスン風景', icon: <FolderOpen size={16} /> },
    { id: 'lifestyle', name: 'ライフスタイル', icon: <FolderOpen size={16} /> },
    { id: 'food', name: '食事・栄養', icon: <FolderOpen size={16} /> },
    { id: 'studio', name: 'スタジオ施設', icon: <FolderOpen size={16} /> },
    { id: 'event', name: 'イベント', icon: <FolderOpen size={16} /> },
    { id: 'favorites', name: 'お気に入り', icon: <Star size={16} /> },
    { id: 'trash', name: 'ゴミ箱', icon: <Trash2 size={16} /> },
];

export function MediaLibraryView() {
    // Use API hooks
    const { data: mediaData, isLoading, error } = useMedia();
    const uploadMedia = useUploadMedia();
    const deleteMediaMutation = useDeleteMedia();

    // Map API data to local format
    const media: MediaItem[] = (mediaData?.data || []).map((item: any) => ({
        id: item.id,
        url: item.url,
        name: item.filename || item.originalFilename,
        type: item.mimeType,
        size: item.size ? `${(item.size / 1024 / 1024).toFixed(1)}MB` : '-',
        uploadedAt: item.createdAt?.split('T')[0] || '-',
        dimensions: item.width && item.height ? `${item.width}x${item.height}` : undefined,
        source: item.source || 'upload',
        folder: item.folder || 'all',
    }));

    const [folders, setFolders] = useState(INITIAL_FOLDERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    
    // NanoBanana States
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedResult, setGeneratedResult] = useState<string | null>(null);

    // Folder creation state
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Calculate folder counts
    const folderCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        // Initialize all folders with 0
        folders.forEach(f => counts[f.id] = 0);
        
        // Count items
        media.forEach(item => {
            if (counts[item.folder] !== undefined) {
                counts[item.folder]++;
            }
        });
        
        counts['all'] = media.length;
        // Mock counts for special folders if not implemented
        // counts['favorites'] = ...
        
        return counts;
    }, [media, folders]);

    const filteredMedia = media.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = selectedFolder === 'all' ? true : 
                              selectedFolder === 'favorites' ? false : // Mock
                              selectedFolder === 'trash' ? false : // Mock
                              item.folder === selectedFolder;
        return matchesSearch && matchesFolder;
    });

    const handleGenerate = () => {
        if (!generatePrompt) return;
        setIsGenerating(true);
        setTimeout(() => {
            const mockUrl = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(generatePrompt)}&sig=${Date.now()}`;
            setGeneratedResult(mockUrl);
            setIsGenerating(false);
        }, 2000);
    };

    const saveGeneratedImage = () => {
        if (generatedResult) {
            const newItem = {
                id: `gen-${Date.now()}`,
                url: generatedResult,
                name: `generated-${Date.now()}.jpg`,
                type: 'image/jpeg',
                size: '1.0MB',
                uploadedAt: new Date().toISOString().split('T')[0],
                dimensions: '800x600',
                source: 'nanobanana',
                folder: 'all'
            };
            setMedia([newItem, ...media]);
            setGeneratedResult(null);
            setGeneratePrompt('');
            setIsGenerateDialogOpen(false);
        }
    };

    const handleDelete = (id: string) => {
        deleteMediaMutation.mutate(id, {
            onSuccess: () => setSelectedItem(null),
        });
    };

    const handleCreateFolder = () => {
        if (!newFolderName) return;
        const newId = `folder-${Date.now()}`;
        const newFolder = { id: newId, name: newFolderName, icon: <FolderOpen size={16} /> };
        // Insert before favorites
        const insertIndex = folders.findIndex(f => f.id === 'favorites');
        const newFolders = [...folders];
        newFolders.splice(insertIndex, 0, newFolder);
        setFolders(newFolders);
        setNewFolderName('');
        setIsCreateFolderOpen(false);
        setSelectedFolder(newId);
    };

    const handleMoveToFolder = (itemId: string, folderId: string) => {
        setMedia(media.map(m => m.id === itemId ? { ...m, folder: folderId } : m));
        // If current view is specific folder, item might disappear (which is expected)
        if (selectedItem?.id === itemId) {
            setSelectedItem({ ...selectedItem, folder: folderId });
        }
    };

    const folderOptions = folders.filter(f => !['all', 'favorites', 'trash'].includes(f.id));

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMedia.mutate({ file });
            e.target.value = ''; // Reset input
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
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">メディアライブラリ</h1>
                    <p className="text-sm text-neutral-500 font-medium">画像リソースの管理とAI生成</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="h-12 !px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploadMedia.isPending}
                    >
                        {uploadMedia.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                アップロード中...
                            </>
                        ) : (
                            'アップロード'
                        )}
                    </Button>
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                </div>
            </header>

            <div className="flex-1 flex min-h-0">
                {/* Left Sidebar: Folders */}
                <div className="w-64 flex-none border-r border-neutral-100 bg-neutral-50/30 flex flex-col py-6">
                    <div className="px-6 mb-6 space-y-3">
                        <Button 
                            variant="outline" 
                            className="w-full rounded-full font-bold border-neutral-200 text-neutral-600 hover:text-neutral-900 bg-white shadow-sm"
                            onClick={() => setIsGenerateDialogOpen(true)}
                        >
                            <Sparkles size={16} className="mr-2 text-amber-500" />
                            AI画像生成
                        </Button>
                        
                        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    className="w-full rounded-full font-bold text-neutral-500 hover:text-neutral-900 hover:bg-white"
                                >
                                    <Plus size={16} className="mr-2" />
                                    新規フォルダ
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>新しいフォルダを作成</DialogTitle>
                                    <DialogDescription>
                                        画像を整理するためのフォルダ名を入力してください。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="folder-name">フォルダ名</Label>
                                    <Input 
                                        id="folder-name" 
                                        value={newFolderName} 
                                        onChange={e => setNewFolderName(e.target.value)} 
                                        placeholder="例: インストラクター写真"
                                        className="mt-2"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>キャンセル</Button>
                                    <Button onClick={handleCreateFolder} disabled={!newFolderName}>作成する</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <ScrollArea className="flex-1 px-3">
                        <div className="space-y-1">
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => setSelectedFolder(folder.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                                        selectedFolder === folder.id 
                                            ? "bg-white shadow-sm text-neutral-900" 
                                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                                    )}
                                >
                                    <span className={cn(
                                        selectedFolder === folder.id ? "text-neutral-900" : "text-neutral-400"
                                    )}>
                                        {folder.icon}
                                    </span>
                                    {folder.name}
                                    <span className="ml-auto text-[10px] text-neutral-400 font-medium">
                                        {folderCounts[folder.id]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content: Masonry Grid */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Toolbar */}
                    <div className="h-16 flex items-center justify-between px-8 border-b border-neutral-100 bg-white flex-none z-10">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-neutral-900">
                                {folders.find(f => f.id === selectedFolder)?.name}
                            </h2>
                            <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {filteredMedia.length}
                            </span>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                            <Input 
                                className="pl-9 h-9 bg-neutral-50 border-transparent focus:bg-white focus:border-neutral-200 rounded-full text-xs font-medium transition-all"
                                placeholder="検索..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                         {filteredMedia.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-400 pb-20">
                                <ImageIcon size={48} className="mb-4 opacity-20" />
                                <p className="font-bold">メディアが見つかりません</p>
                                <p className="text-xs mt-1 opacity-70">アップロードするか、AIで生成してください</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredMedia.map(item => (
                                    <div 
                                        key={item.id}
                                        className="group relative rounded-xl overflow-hidden bg-neutral-100 shadow-sm hover:shadow-md transition-all aspect-square"
                                    >
                                        <div onClick={() => setSelectedItem(item)} className="cursor-zoom-in w-full h-full">
                                            <img 
                                                src={item.url} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-105" 
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Hide element if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    const container = target.closest('.group');
                                                    if (container) {
                                                        (container as HTMLElement).style.display = 'none';
                                                    }
                                                }}
                                            />
                                        </div>
                                        
                                        {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
                                            
                                            {/* Menu Button */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white shadow-sm text-neutral-900">
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>アクション</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuSub>
                                                            <DropdownMenuSubTrigger>
                                                                <FolderOpen size={14} className="mr-2" /> フォルダ移動
                                                            </DropdownMenuSubTrigger>
                                                            <DropdownMenuSubContent>
                                                                {folderOptions.map(folder => (
                                                                    <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(item.id, folder.id)}>
                                                                        {item.folder === folder.id && <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />}
                                                                        {folder.name}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuSub>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.id)}>
                                                            <Trash2 size={14} className="mr-2" /> 削除
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* AI Badge */}
                                            {item.source === 'nanobanana' && (
                                                <div className="absolute top-2 left-2 bg-amber-400/90 backdrop-blur-sm text-amber-950 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm pointer-events-none">
                                                    AI
                                                </div>
                                            )}

                                            {/* Bottom Info */}
                                            <div 
                                                className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-zoom-in"
                                                onClick={() => setSelectedItem(item)}
                                            >
                                                <p className="text-white text-[11px] font-bold truncate mb-0.5">{item.name}</p>
                                                <div className="flex items-center justify-between text-white/70 text-[10px] font-mono">
                                                    <span>{item.dimensions}</span>
                                                    <span>{item.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Dialog (Modal) */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="sm:max-w-[900px] p-0 border-0 overflow-hidden bg-neutral-950 text-white rounded-3xl shadow-2xl flex flex-col md:flex-row h-[80vh] md:h-[600px] [&>button:last-child]:hidden">
                    <div className="sr-only">
                        <DialogTitle>{selectedItem?.name || '画像詳細'}</DialogTitle>
                        <DialogDescription>選択された画像のプレビューと詳細情報</DialogDescription>
                    </div>
                    {selectedItem && (
                        <>
                            {/* Image Preview Area */}
                            <div className="flex-1 bg-black flex items-center justify-center p-8 relative group overflow-hidden">
                                <img 
                                    src={selectedItem.url} 
                                    alt={selectedItem.name} 
                                    className="max-w-full max-h-full object-contain shadow-2xl" 
                                />
                                <div className="absolute top-4 left-4">
                                     <Badge variant="outline" className="bg-black/50 border-white/20 text-white backdrop-blur-md">
                                        {selectedItem.type.split('/')[1].toUpperCase()}
                                     </Badge>
                                </div>
                            </div>

                            {/* Metadata Sidebar */}
                            <div className="w-full md:w-80 bg-neutral-900 p-8 flex flex-col border-l border-white/10 overflow-y-auto">
                                <div className="flex items-start justify-between mb-6">
                                    <h3 className="text-lg font-bold truncate pr-4">{selectedItem.name}</h3>
                                    <button onClick={() => setSelectedItem(null)} className="text-neutral-500 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">フォルダ</Label>
                                            <div className="mt-1">
                                                <Select 
                                                    value={selectedItem.folder} 
                                                    onValueChange={(val) => handleMoveToFolder(selectedItem.id, val)}
                                                >
                                                    <SelectTrigger className="w-full bg-neutral-800 border-neutral-700 text-neutral-200 h-9 text-xs">
                                                        <SelectValue placeholder="フォルダを選択" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                                        {folderOptions.map(folder => (
                                                            <SelectItem key={folder.id} value={folder.id} className="text-xs focus:bg-neutral-700 focus:text-white">
                                                                {folder.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">アップロード日</Label>
                                            <p className="text-sm font-medium text-neutral-300 mt-1">{selectedItem.uploadedAt}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">サイズ</Label>
                                                <p className="text-sm font-mono text-neutral-300 mt-1">{selectedItem.size}</p>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">解像度</Label>
                                                <p className="text-sm font-mono text-neutral-300 mt-1">{selectedItem.dimensions}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10 my-6" />

                                    <div className="space-y-3">
                                        <Button className="w-full bg-white text-black hover:bg-neutral-200 font-bold rounded-full">
                                            <Download size={16} className="mr-2" /> ダウンロード
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white font-bold rounded-full"
                                        >
                                            <ExternalLink size={16} className="mr-2" /> URLをコピー
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30 font-bold rounded-full"
                                            onClick={() => handleDelete(selectedItem.id)}
                                        >
                                            <Trash2 size={16} className="mr-2" /> 完全に削除
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
             {/* Generate Dialog */}
             <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Sparkles className="text-amber-500" />
                            NanoBanana AI
                        </DialogTitle>
                        <DialogDescription>
                            プロンプトから新しい画像を生成します。商用利用可能です。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        {generatedResult ? (
                            <div className="space-y-4">
                                <div className="aspect-video w-full bg-neutral-100 rounded-2xl overflow-hidden">
                                    <img src={generatedResult} alt="Generated" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button variant="ghost" className="rounded-full font-bold" onClick={() => setGeneratedResult(null)}>リトライ</Button>
                                    <Button onClick={saveGeneratedImage} className="bg-neutral-900 text-white rounded-full font-bold px-6">保存する</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Textarea 
                                    placeholder="例: 朝日の差し込む静かなヨガスタジオ、ミニマルなデザイン"
                                    className="min-h-[120px] bg-neutral-50 border-transparent resize-none rounded-2xl focus:ring-amber-200"
                                    value={generatePrompt}
                                    onChange={(e) => setGeneratePrompt(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={handleGenerate} 
                                        disabled={!generatePrompt || isGenerating}
                                        className="bg-amber-400 text-amber-950 hover:bg-amber-500 font-bold rounded-full px-8"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" /> : "生成する"}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper for missing icon
function Sparkles({ size, className }: { size?: number, className?: string }) {
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
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}