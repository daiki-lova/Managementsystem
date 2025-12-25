import React, { useState } from 'react';
import { 
  Settings, Image as ImageIcon, Hash, Folder, Link2, 
  FileText, Upload, Search, X, Check
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Mock categories
const CATEGORIES = ['技術ブログ', 'デザイン', 'お知らせ', 'コラム', 'インタビュー'];

interface ArticleSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    thumbnail: string | undefined;
    setThumbnail: (url: string) => void;
    category: string;
    setCategory: (c: string) => void;
    tags: string[];
    setTags: (t: string[]) => void;
    slug: string;
    setSlug: (s: string) => void;
    description: string;
    setDescription: (d: string) => void;
}

export function ArticleSettingsSheet({
    open, onOpenChange,
    thumbnail, setThumbnail,
    category, setCategory,
    tags, setTags,
    slug, setSlug,
    description, setDescription
}: ArticleSettingsProps) {
    const [tagInput, setTagInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput) {
            e.preventDefault();
            if (!tags.includes(tagInput)) {
                setTags([...tags, tagInput]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleImageSearch = async () => {
        // In a real app, this would call the unsplash API
        // For now, we just set a random unsplash image based on query
        if (!searchQuery) return;
        const url = `https://source.unsplash.com/random/1200x630?${encodeURIComponent(searchQuery)}`;
        setThumbnail(url);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>記事設定</SheetTitle>
                    <SheetDescription>
                        公開に必要なメタデータやアイキャッチ画像を設定します。
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-8">
                    {/* Thumbnail Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <ImageIcon size={18} />
                            アイキャッチ画像
                        </Label>
                        
                        <div className="border-2 border-dashed border-neutral-200 rounded-xl p-1 bg-neutral-50">
                            {thumbnail ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden group">
                                    <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="destructive" size="sm" onClick={() => setThumbnail('')}>
                                            <X size={16} className="mr-2" /> 削除
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video rounded-lg flex flex-col items-center justify-center text-neutral-400 gap-2">
                                    <ImageIcon size={32} className="opacity-20" />
                                    <span className="text-sm">画像が設定されていません</span>
                                </div>
                            )}
                        </div>

                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="upload">アップロード</TabsTrigger>
                                <TabsTrigger value="unsplash">Unsplash検索</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upload" className="mt-4">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-300 border-dashed rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-3 text-neutral-400" />
                                            <p className="text-sm text-neutral-500"><span className="font-semibold">クリックしてアップロード</span></p>
                                        </div>
                                        <input id="dropzone-file" type="file" className="hidden" />
                                    </label>
                                </div>
                            </TabsContent>
                            <TabsContent value="unsplash" className="mt-4 space-y-2">
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="キーワード (例: office, nature)..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Button onClick={handleImageSearch}><Search size={16} /></Button>
                                </div>
                                <p className="text-xs text-neutral-500">キーワードを入力して検索すると、ランダムな画像が設定されます。</p>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="h-px bg-neutral-100" />

                    {/* Category & Tags */}
                    <div className="space-y-6">
                         <div className="space-y-2">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Folder size={18} />
                                カテゴリー
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="カテゴリーを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Hash size={18} />
                                タグ
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="px-2 py-1 gap-1">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1"><X size={12}/></button>
                                    </Badge>
                                ))}
                            </div>
                            <Input 
                                placeholder="タグを入力してEnter..." 
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                            />
                        </div>
                    </div>

                     <div className="h-px bg-neutral-100" />

                    {/* SEO Settings */}
                     <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Link2 size={18} />
                                URLスラッグ
                            </Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-400">/posts/</span>
                                <Input 
                                    value={slug} 
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="article-slug" 
                                    className="font-mono"
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <FileText size={18} />
                                記事の抜粋 (Description)
                            </Label>
                            <Textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="検索結果やSNSで表示される短い説明文を入力してください..."
                                className="h-24 resize-none"
                            />
                            <div className="text-right text-xs text-neutral-400">
                                {description.length} / 120文字
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="pb-8">
                    <Button onClick={() => onOpenChange(false)} className="w-full">
                        <Check size={16} className="mr-2" /> 設定を完了して閉じる
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
