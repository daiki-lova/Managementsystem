import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Check, Circle, Sparkles } from 'lucide-react';
import { cn } from '@/app/admin/lib/utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { GenerationErrorState } from './GenerationErrorState';

export type GenerationStep = 'analyzing' | 'structuring' | 'writing' | 'editing' | 'seo' | 'finalizing';

interface GenerationProgressModalProps {
    isOpen: boolean;
    currentStepIndex: number; // 0-5
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

const STEPS = [
    { label: '構成案の生成', description: '見出し構成と論理展開を設計中...' },
    { label: '本文執筆', description: 'AIが記事の内容をライティング中...' },
    { label: '校正・推敲', description: '誤字脱字のチェックと表現の調整...' },
    { label: 'SEO・LLMO最適化', description: '検索エンジンおよびAI検索への最適化...' },
    { label: 'メタデータ生成', description: 'タグ設定とキーワード調整...' },
    { label: '公開準備完了', description: '記事データの最終保存処理...' },
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
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900">AI記事生成中...</h3>
                                    <p className="text-xs text-neutral-500 mt-1 font-medium">
                                        {articleCount}記事を生成しています
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-blue-600 font-mono">{Math.round(progress)}%</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden mb-8">
                                <motion.div 
                                    className="h-full bg-blue-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            {/* Steps List */}
                            <div className="space-y-5 relative pl-2">
                                {/* Connector Line */}
                                <div className="absolute left-[19px] top-2 bottom-4 w-px bg-neutral-100" />

                                {STEPS.map((step, index) => {
                                    const isCompleted = index < currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    const isPending = index > currentStepIndex;

                                    return (
                                        <div key={index} className="relative flex items-start gap-4 z-10">
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ring-4 ring-white",
                                                isCompleted ? "bg-green-500 text-white" : 
                                                isCurrent ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : 
                                                "bg-neutral-100 text-neutral-300"
                                            )}>
                                                {isCompleted ? (
                                                    <Check size={12} strokeWidth={3} />
                                                ) : isCurrent ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-neutral-300" />
                                                )}
                                            </div>
                                            
                                            <div className={cn(
                                                "flex-1 transition-opacity duration-300",
                                                isPending ? "opacity-40" : "opacity-100"
                                            )}>
                                                <h4 className={cn(
                                                    "text-xs font-bold mb-0.5",
                                                    isCurrent ? "text-blue-600" : "text-neutral-900"
                                                )}>
                                                    {step.label}
                                                </h4>
                                                {isCurrent && (
                                                    <p className="text-[10px] text-neutral-500 animate-pulse">
                                                        {step.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-4 border-t border-neutral-50 text-center">
                                <button 
                                    onClick={onCancel}
                                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors font-medium"
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