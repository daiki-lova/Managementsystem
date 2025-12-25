import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface PublishedEditWarningProps {
    isPublished: boolean;
}

export function PublishedEditWarning({ isPublished }: PublishedEditWarningProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isPublished || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-50 border-b border-amber-200 overflow-hidden"
            >
                <div className="max-w-[850px] mx-auto px-16 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-amber-800">
                        <AlertTriangle size={16} className="shrink-0 text-amber-600" />
                        <p className="text-xs font-medium">
                            この記事は公開中です。変更を保存すると即座に本番サイトに反映されます。
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-100/50 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}