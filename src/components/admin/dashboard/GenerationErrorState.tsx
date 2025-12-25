import React from 'react';
import { XCircle, RefreshCw, CheckCircle2, FileText, PenTool, ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';

// 3ステップパイプラインのステップ名
const STEP_NAMES = ['タイトル生成', '記事執筆', '画像生成'] as const;
const STEP_ICONS = [FileText, PenTool, ImageIcon] as const;

interface GenerationErrorStateProps {
    errorMessage?: string;
    failedStepIndex: number;
    successCount: number;
    onRetry: () => void;
    onCancel: () => void;
    onSavePartial: () => void;
}

export function GenerationErrorState({
    errorMessage = "処理中に予期せぬエラーが発生しました。",
    failedStepIndex,
    successCount,
    onRetry,
    onCancel,
    onSavePartial
}: GenerationErrorStateProps) {
    const stepName = STEP_NAMES[failedStepIndex] || 'Unknown';
    const StepIcon = STEP_ICONS[failedStepIndex] || FileText;

    return (
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <XCircle size={32} className="text-red-500" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 mb-2">生成に失敗しました</h3>
            <p className="text-sm text-neutral-500 max-w-[280px] leading-relaxed mb-3">
                {errorMessage}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-xs font-medium mb-6">
                <StepIcon size={12} />
                「{stepName}」で中断
            </div>

            <div className="w-full space-y-3">
                <Button 
                    onClick={onRetry}
                    className="w-full rounded-full bg-neutral-900 text-white hover:bg-neutral-800 gap-2 font-bold"
                >
                    <RefreshCw size={16} />
                    リトライ
                </Button>

                {successCount > 0 && (
                    <Button 
                        onClick={onSavePartial}
                        variant="outline"
                        className="w-full rounded-full border-neutral-200 text-neutral-700 gap-2 font-bold"
                    >
                        <CheckCircle2 size={16} className="text-green-600" />
                        成功した {successCount} 件のみ保存
                    </Button>
                )}

                <Button 
                    onClick={onCancel}
                    variant="ghost"
                    className="w-full rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 gap-2 text-xs"
                >
                    キャンセルして戻る
                </Button>
            </div>
        </div>
    );
}