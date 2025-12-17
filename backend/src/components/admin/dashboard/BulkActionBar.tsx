import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Send, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onPublish?: () => void;
    onDelete: () => void;
    mode?: 'active' | 'trash';
}

export function BulkActionBar({ 
    selectedCount, 
    onClearSelection, 
    onPublish,
    onDelete,
    mode = 'active',
}: BulkActionBarProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        onDelete();
        setIsDeleteDialogOpen(false);
    };

    return (
        <>
            <AnimatePresence>
                {selectedCount > 0 && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
                    >
                        <div className="flex items-center gap-2 pl-5 pr-2 py-2 bg-white text-neutral-900 rounded-full shadow-xl shadow-neutral-200/50 border border-neutral-200">
                            <span className="text-sm font-bold mr-2">
                                {selectedCount} <span className="font-normal text-neutral-500 text-xs">件選択中</span>
                            </span>
                            
                            <div className="h-4 w-px bg-neutral-200 mx-1" />

                            {mode === 'active' && onPublish && (
                                <Button 
                                    onClick={onPublish}
                                    size="sm" 
                                    className="h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white border-0 font-bold text-xs px-3 gap-1.5"
                                >
                                    <Send size={12} /> 一括公開
                                </Button>
                            )}
                            
                            <Button 
                                onClick={handleDeleteClick}
                                size="sm" 
                                variant="ghost"
                                className="h-8 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs px-3 gap-1.5"
                            >
                                <Trash2 size={12} /> {mode === 'trash' ? '完全削除' : 'ゴミ箱へ'}
                            </Button>

                            <div className="w-2" />

                            <Button 
                                onClick={onClearSelection}
                                size="icon" 
                                variant="ghost"
                                className="h-8 w-8 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>
                            {mode === 'trash' ? '選択した記事を完全に削除しますか？' : '選択した記事をゴミ箱に移動しますか？'}
                        </DialogTitle>
                        <DialogDescription>
                            選択中の {selectedCount} 件の記事を{mode === 'trash' ? '完全に削除' : 'ゴミ箱に移動'}しようとしています。<br/>
                            {mode === 'trash' ? 'この操作は取り消せません。' : 'ゴミ箱から復元できます。'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>キャンセル</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>{mode === 'trash' ? '完全に削除する' : 'ゴミ箱へ移動'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
