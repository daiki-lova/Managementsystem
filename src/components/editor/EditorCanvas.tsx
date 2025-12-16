'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
    Plus, Image, Code, Type, PanelRightClose, PanelRightOpen,
    Heading1, Heading2, Heading3, Heading4, Quote, ChevronLeft,
    Banana, Upload, Library, Loader2, Download, Search, Sparkles, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { AppMode, BlockData } from '../../types';
import { HtmlBlock } from './HtmlBlock';
import { PublishedEditWarning } from '../dashboard/PublishedEditWarning';
import { useCategories, useTags } from '../../lib/hooks';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";

import { Checkbox } from "../../components/ui/checkbox";

interface EditorCanvasProps {
  title: string;
  setTitle: (t: string) => void;
  blocks: BlockData[];
  setBlocks: (b: BlockData[]) => void;
  mode: AppMode;
  
  // Metadata props
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
  metaTitle: string;
  setMetaTitle: (t: string) => void;
  ogImage: string | undefined;
  setOgImage: (url: string | undefined) => void;
  isPublished?: boolean;
}

const MOCK_IMAGES = [
    "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1684369681201-654a7275b32e?w=800&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1661956602116-aa6865609028?w=800&auto=format&fit=crop&q=60",
];

export function EditorCanvas({ 
    title, setTitle, blocks, setBlocks, mode,
    thumbnail, setThumbnail, category, setCategory, tags, setTags, slug, setSlug, description, setDescription,
    metaTitle, setMetaTitle, ogImage, setOgImage,
    isPublished = false
}: EditorCanvasProps) {
  const { data: categoriesResult } = useCategories({ page: 1, limit: 200 });
  const { data: tagsResult } = useTags({ page: 1, limit: 200 });

  const availableCategories = (categoriesResult?.data ?? []).map((c: any) => c.name);
  const availableTags = (tagsResult?.data ?? []).map((t: any) => t.name);

  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Simplified Sidebar State
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [targetField, setTargetField] = useState<'thumbnail' | 'ogImage' | null>(null);

  // Media States
  const [mediaMode, setMediaMode] = useState<'library' | 'upload' | 'generate'>('library');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [userImages, setUserImages] = useState<string[]>([...MOCK_IMAGES]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setUserImages([url, ...userImages]);
        setMediaMode('library');
    }
  };

  const handleGenerateImage = () => {
    if (!generatePrompt) return;
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
        const mockGeneratedUrl = `https://source.unsplash.com/random/800x600/?${encodeURIComponent(generatePrompt)}&sig=${Date.now()}`;
        setGeneratedImages([mockGeneratedUrl, ...generatedImages]);
        setIsGenerating(false);
    }, 2000);
  };

  const addBlock = (type: BlockData['type'], afterId: string, content: string = '') => {
    const newBlock: BlockData = { 
        id: Date.now().toString(), 
        type, 
        content 
    };
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const updateBlockContent = (id: string, content: string) => {
      setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const deleteBlock = (id: string) => {
      if (blocks.length <= 1) return; 
      setBlocks(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="flex w-full min-h-full relative bg-[#F5F7FA]">
      {/* Main Editor Area */}
      <div className="flex-1 transition-all duration-300 ease-in-out flex flex-col items-center">
          
          {/* Warning Banner */}
          <div className="w-full sticky top-0 z-30">
              <PublishedEditWarning isPublished={isPublished} />
          </div>
          
          <div className="w-full max-w-[850px] px-16 pb-40 bg-white min-h-[calc(100vh-8rem)] shadow-[0_0_20px_-5px_rgba(0,0,0,0.03)] border-x border-black/5">
              
              {/* Sidebar Toggle */}
              {!isSidebarOpen && (
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-8 top-28 p-2.5 bg-white border border-neutral-100 shadow-md text-neutral-400 hover:text-neutral-600 rounded-full transition-all hover:scale-105 z-20"
                  >
                      <PanelRightOpen size={20} />
                  </button>
              )}

              {/* Title Area */}
              <div className="pt-12 mb-8 group relative">
                <textarea
                  value={title}
                  onChange={(e) => {
                      setTitle(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  placeholder="記事タイトル"
                  className="w-full text-4xl font-bold border-none outline-none placeholder:text-neutral-300 bg-transparent leading-[1.3] resize-none overflow-hidden min-h-[1.3em]"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                <div className="h-px w-full bg-neutral-100 mt-4" />
              </div>

              {/* Blocks Area */}
              <div className="space-y-[2px]">
                {blocks.map((block, index) => (
                  <BlockWrapper 
                    key={block.id}
                    block={block}
                    isFocused={focusedBlockId === block.id}
                    isHovered={hoveredBlockId === block.id}
                    onFocus={() => setFocusedBlockId(block.id)}
                    onHoverChange={(isHovered) => setHoveredBlockId(isHovered ? block.id : null)}
                    onChange={(content) => updateBlockContent(block.id, content)}
                    onAddBlock={(type) => addBlock(type, block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    mode={mode}
                    placeholder={index === 0 && blocks.length === 1 ? "ここから書き始める" : undefined}
                  />
                ))}
                
                {/* Click area to append at bottom */}
                <div 
                  className="h-32 cursor-text -ml-4 -mr-4" 
                  onClick={() => {
                    const lastBlock = blocks[blocks.length - 1];
                    if (lastBlock && lastBlock.content !== '') {
                        addBlock('p', lastBlock.id);
                    }
                  }}
                />
              </div>
          </div>
      </div>

      {/* Right Sidebar (Tools) */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarOpen ? 360 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-l border-neutral-200 overflow-hidden flex-shrink-0 flex flex-col h-[calc(100vh-4rem)] sticky top-0"
      >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 min-h-[56px]">
              <div className="flex items-center gap-2">
                  {showMediaSelector ? (
                      <button 
                        onClick={() => {
                            setShowMediaSelector(false);
                            setTargetField(null);
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                      >
                          <ChevronLeft size={14} />
                          設定に戻る
                      </button>
                  ) : (
                      <span className="text-sm font-bold text-neutral-800">設定</span>
                  )}
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              >
                  <PanelRightClose size={16} />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-50/50">
              {/* Media Selector Panel */}
              {showMediaSelector && (
              <div className="h-full flex flex-col bg-white">
                  {/* Media Sub-navigation */}
                  <div className="flex items-center border-b border-neutral-100 bg-white px-2">
                      <button 
                        onClick={() => setMediaMode('library')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-medium flex flex-col items-center gap-1 border-b-2 transition-colors",
                            mediaMode === 'library' ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
                        )}
                      >
                          <Library size={16} />
                          保存済み
                      </button>
                      <button 
                        onClick={() => setMediaMode('upload')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-medium flex flex-col items-center gap-1 border-b-2 transition-colors",
                            mediaMode === 'upload' ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
                        )}
                      >
                          <Upload size={16} />
                          アップロード
                      </button>
                      <button 
                        onClick={() => setMediaMode('generate')}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-medium flex flex-col items-center gap-1 border-b-2 transition-colors",
                            mediaMode === 'generate' ? "border-yellow-400 text-neutral-900" : "border-transparent text-neutral-400 hover:text-neutral-600"
                        )}
                      >
                          <Banana size={16} className={mediaMode === 'generate' ? "text-yellow-500 fill-yellow-500" : ""} />
                          NanoBanana
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-neutral-50/50 p-4">
                      {/* Library Mode */}
                      {mediaMode === 'library' && (
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                  {userImages.map((url, i) => (
                                      <div 
                                        key={i} 
                                        className="group relative w-full rounded-md overflow-hidden bg-neutral-200 border border-neutral-200 shadow-sm hover:shadow-md transition-all"
                                        style={{ aspectRatio: '1/1' }}
                                      >
                                          <img src={url} alt="" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              {targetField === 'thumbnail' ? (
                                                  <button 
                                                    onClick={() => {
                                                        setThumbnail(url);
                                                        setShowMediaSelector(false);
                                                        setTargetField(null);
                                                    }}
                                                    className="bg-white text-neutral-900 text-[10px] px-2 py-1 rounded font-medium hover:bg-blue-50 shadow-sm"
                                                  >
                                                      カバーに設定
                                                  </button>
                                              ) : targetField === 'ogImage' ? (
                                                  <button 
                                                    onClick={() => {
                                                        setOgImage(url);
                                                        setShowMediaSelector(false);
                                                        setTargetField(null);
                                                    }}
                                                    className="bg-white text-neutral-900 text-[10px] px-2 py-1 rounded font-medium hover:bg-blue-50 shadow-sm"
                                                  >
                                                      OGPに設定
                                                  </button>
                                              ) : (
                                                <>
                                                  <button 
                                                    onClick={() => {
                                                        const lastBlock = blocks[blocks.length - 1];
                                                        addBlock('image', lastBlock.id, url);
                                                        setShowMediaSelector(false);
                                                    }}
                                                    className="bg-white text-neutral-900 text-[10px] px-2 py-1 rounded font-medium hover:bg-blue-50 shadow-sm"
                                                  >
                                                      挿入
                                                  </button>
                                                  <button 
                                                    onClick={() => {
                                                        setThumbnail(url);
                                                        setShowMediaSelector(false);
                                                    }}
                                                    className="bg-white text-neutral-900 text-[10px] px-2 py-1 rounded font-medium hover:bg-blue-50 shadow-sm"
                                                  >
                                                      カバー
                                                  </button>
                                                </>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                              {userImages.length === 0 && (
                                  <div className="text-center py-8 text-neutral-400 text-xs">
                                      画像がありません。<br/>アップロードまたは生成してください。
                                  </div>
                              )}
                          </div>
                      )}

                      {/* Upload Mode */}
                      {mediaMode === 'upload' && (
                          <div className="space-y-4 h-full flex flex-col">
                              <div className="border-2 border-dashed border-neutral-200 rounded-lg flex-1 flex flex-col items-center justify-center text-neutral-400 hover:border-blue-400 hover:bg-blue-50/10 transition-all cursor-pointer relative bg-white">
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                  />
                                  <Upload size={32} className="mb-4 text-neutral-300" />
                                  <span className="text-sm font-medium text-neutral-600">画像を選択またはドロップ</span>
                                  <span className="text-xs text-neutral-400 mt-1">JPG, PNG, GIF up to 5MB</span>
                              </div>
                          </div>
                      )}

                      {/* Generate Mode (NanoBanana) */}
                      {mediaMode === 'generate' && (
                          <div className="space-y-6">
                              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                                  <div className="flex items-center gap-2 mb-3">
                                      <div className="bg-yellow-100 p-1.5 rounded-full">
                                          <Banana size={16} className="text-yellow-600 fill-yellow-600" />
                                      </div>
                                      <span className="text-xs font-bold text-yellow-800">NanoBanana AI</span>
                                  </div>
                                  <div className="space-y-3">
                                      <Textarea 
                                        placeholder="どのような画像を生成しますか？"
                                        className="bg-white border-yellow-200 focus:border-yellow-400 min-h-[80px] text-xs resize-none"
                                        value={generatePrompt}
                                        onChange={(e) => setGeneratePrompt(e.target.value)}
                                      />
                                      <Button 
                                        onClick={handleGenerateImage}
                                        disabled={isGenerating || !generatePrompt}
                                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border border-yellow-500/20"
                                      >
                                          {isGenerating ? (
                                              <>
                                                <Loader2 size={14} className="animate-spin mr-2" /> 生成中...
                                              </>
                                          ) : (
                                              <>
                                                <Sparkles size={14} className="mr-2" /> 生成する
                                              </>
                                          )}
                                      </Button>
                                  </div>
                              </div>

                              {generatedImages.length > 0 && (
                                  <div className="space-y-2">
                                      <div className="text-xs font-bold text-neutral-500 px-1">生成履歴</div>
                                      <div className="grid grid-cols-2 gap-3">
                                          {generatedImages.map((url, i) => (
                                              <div 
                                                key={i} 
                                                className="group relative w-full rounded-lg overflow-hidden bg-neutral-200 border border-neutral-200 shadow-sm"
                                                style={{ aspectRatio: '1/1' }}
                                              >
                                                  <img src={url} alt="Generated" className="w-full h-full object-cover" />
                                                  
                                                  {/* Action Overlay */}
                                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                                      <div className="flex gap-2 w-full">
                                                        {targetField === 'thumbnail' ? (
                                                            <button 
                                                                onClick={() => {
                                                                    setThumbnail(url);
                                                                    setShowMediaSelector(false);
                                                                    setTargetField(null);
                                                                }}
                                                                className="flex-1 bg-white text-neutral-900 text-[10px] py-1.5 rounded font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                                                            >
                                                                <Image size={12} /> カバーに設定
                                                            </button>
                                                        ) : targetField === 'ogImage' ? (
                                                            <button 
                                                                onClick={() => {
                                                                    setOgImage(url);
                                                                    setShowMediaSelector(false);
                                                                    setTargetField(null);
                                                                }}
                                                                className="flex-1 bg-white text-neutral-900 text-[10px] py-1.5 rounded font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                                                            >
                                                                <Image size={12} /> OGPに設定
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => {
                                                                        const lastBlock = blocks[blocks.length - 1];
                                                                        addBlock('image', lastBlock.id, url);
                                                                        setShowMediaSelector(false);
                                                                    }}
                                                                    className="flex-1 bg-white text-neutral-900 text-[10px] py-1.5 rounded font-medium hover:bg-blue-50 flex items-center justify-center gap-1"
                                                                >
                                                                    <FileText size={12} /> 挿入
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        setUserImages([url, ...userImages]);
                                                                        setMediaMode('library');
                                                                    }}
                                                                    className="flex-1 bg-neutral-800 text-white text-[10px] py-1.5 rounded font-medium hover:bg-neutral-700 flex items-center justify-center gap-1"
                                                                >
                                                                    <Download size={12} /> 保存
                                                                </button>
                                                            </>
                                                        )}
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
              )}

              {/* Settings Panel (Properties) */}
              {!showMediaSelector && (
              <div className="p-4">
                  <div className="space-y-8">
                      {/* Basic Settings */}
                      <div className="space-y-1">
                          <h3 className="text-xs font-bold text-neutral-900 px-1 mb-2">基本設定</h3>
                          <PropertyRow label="Slug">
                              <div className="flex items-center gap-1 w-full">
                                  <span className="text-neutral-400">/</span>
                                  <input 
                                      value={slug}
                                      onChange={(e) => setSlug(e.target.value)}
                                      className="bg-transparent border-none outline-none text-sm w-full hover:bg-neutral-100 rounded px-1 py-0.5 transition-colors"
                                      placeholder="slug-here"
                                  />
                              </div>
                          </PropertyRow>

                          <PropertyRow label="Cover">
                              <div className="w-full">
                                  {thumbnail ? (
                                      <div className="relative group aspect-video rounded overflow-hidden bg-neutral-100 border border-neutral-200">
                                          <img src={thumbnail} alt="Cover" className="w-full h-full object-contain" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              <button onClick={() => setThumbnail('')} className="text-white hover:text-red-200 text-xs">削除</button>
                                              <button onClick={() => {
                                                  setTargetField('thumbnail');
                                                  setShowMediaSelector(true);
                                              }} className="text-white hover:text-blue-200 text-xs">変更</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <button 
                                        onClick={() => {
                                            setTargetField('thumbnail');
                                            setShowMediaSelector(true);
                                        }}
                                        className="w-full h-20 bg-neutral-100 border border-neutral-200 rounded flex items-center justify-center text-neutral-400 hover:bg-neutral-200 transition-colors"
                                      >
                                          <Image size={16} className="mr-2" />
                                          <span className="text-xs">画像を選択</span>
                                      </button>
                                  )}
                              </div>
                          </PropertyRow>

                          <PropertyRow label="Category">
                              <div className="flex flex-wrap gap-1 px-1">
                                  {category && (
                                      <span className="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                          {category}
                                          <button onClick={() => setCategory('')} className="hover:text-red-500">×</button>
                                      </span>
                                  )}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-xs text-neutral-400 hover:text-neutral-600 px-1 h-5 flex items-center transition-colors">
                                            {category ? <span className="flex items-center gap-1"><span className="text-[10px] mr-0.5">↻</span>変更</span> : <span className="flex items-center gap-1"><Plus size={12} className="mr-1"/> カテゴリーを選択</span>}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-1" align="start">
                                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                                            {(availableCategories.length > 0 ? availableCategories : ["カテゴリがありません"]).map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => cat !== "カテゴリがありません" && setCategory(cat)}
                                                    className={cn(
                                                        "w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-100 rounded cursor-pointer flex justify-between items-center",
                                                        category === cat && "bg-neutral-100 font-medium"
                                                    )}
                                                >
                                                    {cat}
                                                    {category === cat && <span className="text-neutral-500">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                  </Popover>
                              </div>
                          </PropertyRow>

                          <PropertyRow label="Tags">
                              <div className="flex flex-wrap gap-1 px-1">
                                  {tags.map(tag => (
                                      <span key={tag} className="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                          #{tag}
                                          <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500">×</button>
                                      </span>
                                  ))}
                                  <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="text-xs text-neutral-400 hover:text-neutral-600 px-1 h-5 flex items-center transition-colors">
                                            <Plus size={12} className="mr-1" /> タグを追加
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-1" align="start">
                                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                                            {availableTags.filter(t => !tags.includes(t)).map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => setTags([...tags, tag])}
                                                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-neutral-100 rounded cursor-pointer"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                  </Popover>
                              </div>
                          </PropertyRow>
                      </div>

                      {/* SEO Settings */}
                      <div className="space-y-1">
                           <h3 className="text-xs font-bold text-neutral-900 px-1 mb-2">SEO設定</h3>
                           <PropertyRow label="Page Title">
                              <div className="w-full space-y-2">
                                  <div className="flex items-center space-x-2">
                                     <Checkbox 
                                        id="use-title" 
                                        checked={!metaTitle}
                                        onCheckedChange={(checked) => {
                                            if (checked) setMetaTitle('');
                                            else setMetaTitle(title || ' '); // Set current title or space to enable editing
                                        }}
                                     />
                                     <label
                                       htmlFor="use-title"
                                       className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-600"
                                     >
                                       記事タイトルと同じ
                                     </label>
                                  </div>
                                  <input 
                                      value={metaTitle}
                                      onChange={(e) => setMetaTitle(e.target.value)}
                                      className={cn(
                                          "bg-transparent border-none outline-none text-sm w-full rounded px-1 py-0.5 transition-colors placeholder:text-neutral-400",
                                          !metaTitle ? "text-neutral-400 italic pointer-events-none" : "hover:bg-neutral-100"
                                      )}
                                      placeholder={title || "記事タイトルが適用されます"}
                                      readOnly={!metaTitle} 
                                  />
                              </div>
                           </PropertyRow>
                           <PropertyRow label="Description">
                              <div className="w-full space-y-2">
                                  <div className="flex items-center space-x-2">
                                     <Checkbox 
                                        id="use-excerpt" 
                                        checked={!description}
                                        onCheckedChange={(checked) => {
                                            if (checked) setDescription('');
                                            else {
                                                const excerpt = blocks.find(b => b.type === 'p' && b.content)?.content.slice(0, 120) || " ";
                                                setDescription(excerpt);
                                            }
                                        }}
                                     />
                                     <label
                                       htmlFor="use-excerpt"
                                       className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-600"
                                     >
                                       本文の冒頭を使用
                                     </label>
                                  </div>
                                  <textarea 
                                      value={description}
                                      onChange={(e) => setDescription(e.target.value)}
                                      className={cn(
                                          "w-full bg-transparent border-none outline-none text-sm resize-none rounded px-1 py-0.5 transition-colors min-h-[80px] placeholder:text-neutral-400",
                                          !description ? "text-neutral-400 italic pointer-events-none" : "hover:bg-neutral-100"
                                      )}
                                      placeholder={blocks.find(b => b.type === 'p' && b.content)?.content.slice(0, 80) + "..." || "本文から自動生成されます"}
                                      readOnly={!description}
                                  />
                              </div>
                          </PropertyRow>
                      </div>

                      {/* OGP Settings */}
                      <div className="space-y-1">
                           <h3 className="text-xs font-bold text-neutral-900 px-1 mb-2">OGP設定</h3>
                           <PropertyRow label="OG Image">
                               <div className="space-y-3 w-full">
                                   <div className="flex items-center space-x-2">
                                     <Checkbox 
                                        id="use-cover" 
                                        checked={!ogImage}
                                        onCheckedChange={(checked) => {
                                            if (checked) setOgImage(undefined);
                                            else setOgImage(thumbnail || '');
                                        }}
                                     />
                                     <label
                                       htmlFor="use-cover"
                                       className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-600"
                                     >
                                       カバー画像を使用
                                     </label>
                                   </div>

                                   {!ogImage ? (
                                      thumbnail ? (
                                          <div className="relative aspect-video rounded overflow-hidden bg-neutral-100 opacity-50 border border-neutral-200">
                                              <img src={thumbnail} alt="Cover" className="w-full h-full object-contain grayscale" />
                                              <div className="absolute inset-0 flex items-center justify-center text-neutral-900 font-bold text-xs bg-white/50">
                                                  カバー画像が適用されます
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="h-20 bg-neutral-50 border border-neutral-200 border-dashed rounded flex items-center justify-center text-neutral-400 text-xs">
                                              カバー画像が未設定です
                                          </div>
                                      )
                                   ) : (
                                      <div className="relative group aspect-video rounded overflow-hidden bg-neutral-100 border border-neutral-200">
                                          <img src={ogImage} alt="OGP" className="w-full h-full object-contain" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              <button onClick={() => {
                                                  setTargetField('ogImage');
                                                  setShowMediaSelector(true);
                                              }} className="text-white hover:text-blue-200 text-xs">変更</button>
                                          </div>
                                      </div>
                                   )}
                               </div>
                           </PropertyRow>
                      </div>
                  </div>
              </div>
              )}
          </div>
      </motion.div>
    </div>
  );
}

function PropertyRow({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="flex items-start py-3 border-b border-neutral-100 last:border-0 min-h-[40px]">
            <div className="w-20 pt-1 flex-shrink-0 text-xs text-neutral-500 font-medium truncate pr-2">
                {label}
            </div>
            <div className="flex-1 min-w-0 text-sm text-neutral-800">
                {children}
            </div>
        </div>
    )
}

interface BlockWrapperProps {
    block: BlockData;
    isFocused: boolean;
    isHovered: boolean;
    onFocus: () => void;
    onHoverChange: (h: boolean) => void;
    onChange: (content: string) => void;
    onAddBlock: (type: BlockData['type'], content?: string) => void;
    onDelete: () => void;
    mode: AppMode;
    placeholder?: string;
}

function BlockWrapper({ block, isFocused, isHovered, onFocus, onHoverChange, onChange, onAddBlock, onDelete, mode, placeholder }: BlockWrapperProps) {
    return (
        <div 
            className="relative group/block flex items-start -ml-10 pl-10 pr-4"
            onMouseEnter={() => onHoverChange(true)}
            onMouseLeave={() => onHoverChange(false)}
        >
            {/* Gutter Action Area */}
            <div className={cn(
                "absolute left-0 top-1 w-8 flex justify-center transition-opacity duration-200",
                (isHovered || isFocused) ? "opacity-100" : "opacity-0 select-none pointer-events-none"
            )}>
                <BlockActionMenu onAdd={onAddBlock} onDelete={onDelete} />
            </div>

            {/* Block Content */}
            <div className="flex-1 min-w-0 relative">
                <BlockContent 
                    block={block} 
                    isFocused={isFocused} 
                    onFocus={onFocus} 
                    onChange={onChange}
                    placeholder={placeholder}
                />
                 
                {/* Inline Text Menu (Bubble) */}
                <AnimatePresence>
                    {isFocused && block.content.length > 0 && block.type !== 'html' && !window.getSelection()?.isCollapsed && (
                         <BubbleMenu />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

function BlockActionMenu({ onAdd, onDelete }: { onAdd: (t: BlockData['type']) => void, onDelete: () => void }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center gap-0.5">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button className="p-0.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors">
                        <Plus size={18} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-1" align="start" sideOffset={10}>
                    <div className="text-xs font-bold text-neutral-400 px-2 py-1.5 uppercase tracking-wider">Basic blocks</div>
                    <MenuOption icon={<Type size={18} />} label="テキスト" description="通常の段落テキスト" onClick={() => { onAdd('p'); setOpen(false); }} />
                    <MenuOption icon={<Heading2 size={18} />} label="見出し 2" description="セクションの大見出し" onClick={() => { onAdd('h2'); setOpen(false); }} />
                    <MenuOption icon={<Heading3 size={18} />} label="見出し 3" description="セクションの中見出し" onClick={() => { onAdd('h3'); setOpen(false); }} />
                    <MenuOption icon={<Heading4 size={18} />} label="見出し 4" description="セクションの小見出し" onClick={() => { onAdd('h4'); setOpen(false); }} />
                    
                    <div className="h-px bg-neutral-100 my-1" />
                    <div className="text-xs font-bold text-neutral-400 px-2 py-1.5 uppercase tracking-wider">Media</div>
                    <MenuOption icon={<Image size={18} />} label="画像" description="画像をアップロードまたは埋め込み" onClick={() => { onAdd('image'); setOpen(false); }} />
                    <MenuOption icon={<Code size={18} />} label="HTML埋め込み" description="iframeやカスタムコード" onClick={() => { onAdd('html'); setOpen(false); }} />
                </PopoverContent>
            </Popover>
        </div>
    )
}

function BubbleMenu() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -50 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 z-50 flex items-center gap-1 p-1 bg-neutral-900 text-white rounded-lg shadow-xl"
            style={{ left: '0%' }} 
        >
            <ToolbarButton label="Bold" icon={<span className="font-bold font-serif">B</span>} />
            <ToolbarButton label="Italic" icon={<span className="italic font-serif">i</span>} />
            <ToolbarButton label="Link" icon={<span className="underline decoration-1">U</span>} />
            <div className="w-px h-4 bg-neutral-700 mx-1" />
            <ToolbarButton label="H2" icon={<Heading2 size={14} />} />
            <ToolbarButton label="H3" icon={<Heading3 size={14} />} />
            <ToolbarButton label="Quote" icon={<Quote size={14} />} />
        </motion.div>
    )
}

function ToolbarButton({ label, icon }: { label: string, icon: React.ReactNode }) {
    return (
        <button 
            className="p-1.5 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors"
            title={label}
        >
            {icon}
        </button>
    )
}


function BlockContent({ block, isFocused, onFocus, onChange, placeholder }: { 
  block: BlockData, 
  isFocused: boolean, 
  onFocus: () => void,
  onChange: (s: string) => void,
  placeholder?: string
}) {
  const inputRef = useRef<HTMLElement>(null);

  // Sync for simple text blocks
  useEffect(() => {
    if (block.type === 'html' || block.type === 'image') return;
    if (inputRef.current && inputRef.current.innerText !== block.content) {
        if (!isFocused) {
            inputRef.current.innerText = block.content;
        }
    }
  }, [block.content, isFocused, block.type]);

  if (block.type === 'html') {
      return <HtmlBlock block={block} isFocused={isFocused} onChange={onChange} />;
  }

  if (block.type === 'h2') {
    return (
      <h2 
        className="text-3xl font-bold text-neutral-800 outline-none mb-4 mt-12 leading-tight empty:before:content-[attr(placeholder)] empty:before:text-neutral-300"
        contentEditable
        onFocus={onFocus}
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText || "")}
        placeholder="見出し2"
        ref={inputRef as any}
      />
    );
  }

  if (block.type === 'h3') {
    return (
      <h3 
        className="text-2xl font-bold text-neutral-800 outline-none mb-3 mt-8 leading-tight empty:before:content-[attr(placeholder)] empty:before:text-neutral-300"
        contentEditable
        onFocus={onFocus}
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText || "")}
        placeholder="見出し3"
        ref={inputRef as any}
      />
    );
  }

  if (block.type === 'h4') {
    return (
      <h4 
        className="text-xl font-bold text-neutral-800 outline-none mb-2 mt-6 leading-tight empty:before:content-[attr(placeholder)] empty:before:text-neutral-300"
        contentEditable
        onFocus={onFocus}
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText || "")}
        placeholder="見出し4"
        ref={inputRef as any}
      />
    );
  }

  if (block.type === 'image') {
      return (
          <div className="my-6 group relative">
               {block.content ? (
                   <div className="relative rounded-xl overflow-hidden border border-neutral-100 bg-neutral-50">
                       <img src={block.content} alt="" className="w-full h-auto" />
                       <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onChange('')}>削除</Button>
                       </div>
                   </div>
               ) : (
                   <div className={cn(
                       "w-full aspect-video bg-neutral-50 border-2 border-dashed border-neutral-100 rounded-xl flex flex-col items-center justify-center text-neutral-400 transition-colors",
                       isFocused ? "border-blue-200 bg-blue-50/30" : "hover:border-neutral-200 hover:bg-neutral-100/50"
                   )}>
                        <Image className="w-12 h-12 mb-3 text-neutral-300" />
                        <span className="text-sm font-medium">画像をアップロード</span>
                        <span className="text-xs text-neutral-400 mt-1">またはドラッグ＆ドロップ</span>
                   </div>
               )}
          </div>
      )
  }

  return (
    <p 
      className="text-[1.05rem] text-neutral-800 leading-[1.8] outline-none py-1 min-h-[1.8em] empty:before:content-[attr(placeholder)] empty:before:text-neutral-300 cursor-text"
      contentEditable
      ref={inputRef as any}
      onFocus={onFocus}
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.innerText || "")}
      placeholder={placeholder || "テキストを入力、または '/' でコマンド..."}
      onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // In a real app, this would trigger adding a new block
          }
      }}
    />
  );
}

function MenuOption({ icon, label, description, onClick }: { icon: React.ReactNode, label: string, description: string, onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-neutral-100 rounded-lg text-left transition-colors group">
            <div className="p-2 bg-white border border-neutral-200 rounded-md text-neutral-500 group-hover:border-neutral-300 group-hover:text-neutral-700 shadow-sm">
                {icon}
            </div>
            <div>
                <div className="text-sm font-medium text-neutral-700 group-hover:text-black">{label}</div>
                <div className="text-xs text-neutral-400 group-hover:text-neutral-500">{description}</div>
            </div>
        </button>
    )
}
