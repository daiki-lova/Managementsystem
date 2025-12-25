import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileEdit, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/app/admin/lib/utils';

interface TaskSummaryCardsProps {
    draftCount: number;
    reviewCount: number;
    scheduledCount: number;
    publishedThisWeekCount: number;
    scheduleTimes?: string[]; // e.g. ["10:00", "14:00"]
    onNavigateToDrafts: () => void;
    onNavigateToReviews: () => void;
}

export function TaskSummaryCards({
    draftCount = 0,
    reviewCount = 0,
    scheduledCount = 0,
    publishedThisWeekCount = 0,
    scheduleTimes = [],
    onNavigateToDrafts,
    onNavigateToReviews
}: TaskSummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Drafts Card */}
            <SummaryCard
                label="下書き"
                count={draftCount}
                icon={<FileEdit size={16} />}
                color="text-neutral-500"
                actionLink="確認する"
                onAction={onNavigateToDrafts}
                isEmpty={draftCount === 0}
            />

            {/* Reviews Card */}
            <SummaryCard
                label="レビュー待ち"
                count={reviewCount}
                icon={<Eye size={16} />}
                color="text-blue-600"
                actionLink="確認する"
                onAction={onNavigateToReviews}
                isEmpty={reviewCount === 0}
                highlight
            />

            {/* Scheduled Card */}
            <div className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex flex-col justify-between h-full transition-all">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                        <Clock size={14} className={scheduledCount === 0 ? "text-neutral-300" : "text-orange-500"} />
                        本日公開予定
                    </span>
                </div>
                <div>
                    <span className={cn(
                        "text-2xl font-bold block mb-1",
                        scheduledCount === 0 ? "text-neutral-300" : "text-neutral-900"
                    )}>
                        {scheduledCount}
                    </span>
                    {scheduledCount > 0 && scheduleTimes.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {scheduleTimes.map((time, i) => (
                                <span key={i} className="text-[10px] font-mono bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100">
                                    {time}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-[10px] text-neutral-400">予定なし</span>
                    )}
                </div>
            </div>

            {/* Published Card */}
            <SummaryCard
                label="公開済み (今週)"
                count={publishedThisWeekCount}
                icon={<CheckCircle2 size={16} />}
                color="text-emerald-600"
                isEmpty={publishedThisWeekCount === 0}
            />
        </div>
    );
}

function SummaryCard({
    label, count, icon, color, actionLink, onAction, isEmpty, highlight
}: {
    label: string, count: number, icon: React.ReactNode, color: string, actionLink?: string, onAction?: () => void, isEmpty?: boolean, highlight?: boolean
}) {
    return (
        <div className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm flex flex-col justify-between h-full transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                    <span className={cn(isEmpty ? "text-neutral-300" : color)}>{icon}</span>
                    {label}
                </span>
                {actionLink && !isEmpty && (
                    <button
                        onClick={onAction}
                        className="text-[10px] font-medium text-neutral-400 hover:text-neutral-900 flex items-center gap-0.5 transition-colors group"
                    >
                        {actionLink} <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>
            <div className="flex items-baseline gap-1">
                <span className={cn(
                    "text-2xl font-bold block",
                    isEmpty ? "text-neutral-300" : "text-neutral-900"
                )}>
                    {count}
                </span>
                <span className="text-xs text-neutral-400 font-medium">件</span>
            </div>
        </div>
    );
}