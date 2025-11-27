import React, { useState, useEffect } from 'react';
import { Code, Eye, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BlockData } from '../../types';

interface HtmlBlockProps {
    block: BlockData;
    isFocused: boolean;
    onChange: (content: string) => void;
}

export function HtmlBlock({ block, isFocused, onChange }: HtmlBlockProps) {
    const [view, setView] = useState<'code' | 'preview'>('code');
    const [localContent, setLocalContent] = useState(block.content);

    // Sync prop changes to local state if needed
    useEffect(() => {
        setLocalContent(block.content);
    }, [block.content]);

    const handleBlur = () => {
        onChange(localContent);
    };

    return (
        <div className="my-6 group border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 shadow-sm hover:shadow-md transition-shadow">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <Code size={14} />
                    <span>HTML Embed</span>
                </div>
                <div className="flex bg-white rounded-md p-0.5 border border-neutral-200">
                    <button
                        onClick={() => setView('code')}
                        className={cn(
                            "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                            view === 'code' ? "bg-neutral-100 text-black" : "text-neutral-500 hover:text-neutral-700"
                        )}
                    >
                        <Code size={12} /> Code
                    </button>
                    <button
                        onClick={() => setView('preview')}
                        className={cn(
                            "px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5",
                            view === 'preview' ? "bg-blue-50 text-blue-600" : "text-neutral-500 hover:text-neutral-700"
                        )}
                    >
                        <Eye size={12} /> Preview
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="relative min-h-[120px]">
                {view === 'code' ? (
                    <textarea
                        value={localContent}
                        onChange={(e) => setLocalContent(e.target.value)}
                        onBlur={handleBlur}
                        placeholder="<div class='my-custom-class'>Paste your HTML here...</div>"
                        className="w-full h-full min-h-[200px] p-4 font-mono text-sm bg-neutral-900 text-neutral-200 resize-y outline-none focus:ring-2 focus:ring-blue-500/20"
                        spellCheck={false}
                    />
                ) : (
                    <div className="p-8 bg-white checkerboard-pattern min-h-[200px] flex items-center justify-center">
                        <div 
                            className="w-full"
                            dangerouslySetInnerHTML={{ __html: localContent }} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
