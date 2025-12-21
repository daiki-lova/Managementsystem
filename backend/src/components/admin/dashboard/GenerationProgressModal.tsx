import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, Sparkles, FileText, PenTool, ImageIcon } from 'lucide-react';
import { cn } from '@/app/admin/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { GenerationErrorState } from './GenerationErrorState';

export type GenerationStep = 'title' | 'article' | 'image';

interface GenerationProgressModalProps {
    isOpen: boolean;
    currentStepIndex: number; // 0-2 (3ステップパイプライン)
    progress: number; // 0-100
    articleCount: number;
    status: 'processing' | 'error' | 'completed';
    errorMessage?: string;
    onCancel: () => void;
    onComplete: () => void;
    onRetry: () => void;
    onSavePartial?: () => void;
    successCount?: number;
}

// 3ステップパイプラインに合わせたステップ定義
const STEPS = [
    {
        label: 'タイトル生成',
        description: 'SEOに最適化されたタイトルを生成中...',
        icon: FileText,
        progressRange: [0, 20],
        color: 'blue'
    },
    {
        label: '記事執筆',
        description: '監修者の声を反映した記事を執筆中...',
        icon: PenTool,
        progressRange: [20, 80],
        color: 'violet'
    },
    {
        label: '画像生成',
        description: '記事に合わせた画像を生成中...',
        icon: ImageIcon,
        progressRange: [80, 100],
        color: 'emerald'
    },
];

export function GenerationProgressModal({
    isOpen,
    currentStepIndex,
    progress,
    articleCount,
    status,
    errorMessage,
    onCancel,
    onComplete,
    onRetry,
    onSavePartial,
    successCount = 0
}: GenerationProgressModalProps) {
    
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && status !== 'processing' && onCancel()}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl bg-white">
                <DialogHeader className="sr-only">
                    <DialogTitle>記事生成ステータス</DialogTitle>
                    <DialogDescription>
                        現在、AIが記事を生成しています。進捗状況をご確認ください。
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8">
                    {status === 'error' ? (
                        <GenerationErrorState 
                            errorMessage={errorMessage}
                            failedStepIndex={currentStepIndex}
                            successCount={successCount}
                            onRetry={onRetry}
                            onCancel={onCancel}
                            onSavePartial={onSavePartial || onCancel}
                        />
                    ) : status === 'completed' ? (
                        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-2">生成が完了しました！</h3>
                            <p className="text-neutral-500 mb-8 text-sm">
                                {articleCount}件の記事が正常に生成されました。<br/>
                                内容を確認して公開しましょう。
                            </p>
                            <Button 
                                onClick={onComplete}
                                className="w-full rounded-full h-12 bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-lg shadow-neutral-200"
                            >
                                記事一覧を見る
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Header with animated gradient */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                        <motion.span
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="inline-block w-2 h-2 rounded-full bg-blue-500"
                                        />
                                        AI記事生成中
                                    </h3>
                                    <p className="text-xs text-neutral-500 mt-1 font-medium">
                                        {articleCount}件の記事を生成しています
                                    </p>
                                </div>
                                <div className="text-right">
                                    <motion.span
                                        key={Math.round(progress)}
                                        initial={{ scale: 1.2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent font-mono"
                                    >
                                        {Math.round(progress)}%
                                    </motion.span>
                                </div>
                            </div>

                            {/* Multi-color Progress Bar */}
                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden mb-8 relative">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                                {/* Shimmer effect */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    style={{ width: '50%' }}
                                />
                            </div>

                            {/* 3 Steps with cards */}
                            <div className="space-y-3">
                                {STEPS.map((step, index) => {
                                    const isCompleted = index < currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const isPending = index > currentStepIndex;
                                    const Icon = step.icon;

                                    // Calculate step-specific progress
                                    let stepProgress = 0;
                                    if (isCompleted) {
                                        stepProgress = 100;
                                    } else if (isCurrent) {
                                        const [start, end] = step.progressRange;
                                        stepProgress = Math.min(100, Math.max(0, ((progress - start) / (end - start)) * 100));
                                    }

                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={cn(
                                                "relative rounded-xl p-4 transition-all duration-500",
                                                isCurrent ? "bg-gradient-to-r from-blue-50 to-violet-50 shadow-sm border border-blue-100" :
                                                isCompleted ? "bg-emerald-50/50 border border-emerald-100" :
                                                "bg-neutral-50/50 border border-transparent"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500",
                                                    isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" :
                                                    isCurrent ? "bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-200" :
                                                    "bg-neutral-200 text-neutral-400"
                                                )}>
                                                    {isCompleted ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 300 }}
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </motion.div>
                                                    ) : isCurrent ? (
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                        >
                                                            <Loader2 size={20} />
                                                        </motion.div>
                                                    ) : (
                                                        <Icon size={18} />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={cn(
                                                            "text-sm font-bold transition-colors",
                                                            isCurrent ? "text-blue-700" :
                                                            isCompleted ? "text-emerald-700" :
                                                            "text-neutral-400"
                                                        )}>
                                                            {step.label}
                                                        </h4>
                                                        {isCurrent && (
                                                            <span className="text-xs font-medium text-blue-500">
                                                                {Math.round(stepProgress)}%
                                                            </span>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="text-xs font-medium text-emerald-500">完了</span>
                                                        )}
                                                    </div>

                                                    <AnimatePresence mode="wait">
                                                        {isCurrent && (
                                                            <motion.p
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="text-xs text-neutral-500 mt-1"
                                                            >
                                                                {step.description}
                                                            </motion.p>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Step progress bar */}
                                                    {isCurrent && (
                                                        <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden mt-2">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${stepProgress}%` }}
                                                                transition={{ duration: 0.3 }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
                                <button
                                    onClick={onCancel}
                                    className="text-xs text-neutral-400 hover:text-red-500 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-red-50"
                                >
                                    処理を中断してキャンセル
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}