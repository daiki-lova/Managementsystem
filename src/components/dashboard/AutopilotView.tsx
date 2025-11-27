import React, { useState } from 'react';
import { 
    TrendingUp, Search, ArrowRight, Sparkles, 
    FileText, Clock, CheckCircle2, AlertCircle, 
    MoreHorizontal, Play, BarChart2, Database,
    Calendar as CalendarIcon, User, Bot, PenTool
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// Types
type PlanningStatus = 'proposal' | 'generating' | 'review' | 'scheduled';

interface ArticlePlan {
    id: string;
    title: string;
    theme: string;
    targetKeyword: string;
    dataEvidence: {
        source: 'GSC' | 'GA4' | 'Trend';
        metric: string;
        value: string;
        description: string;
    };
    status: PlanningStatus;
    generatedAt?: string;
    scheduledFor?: string;
    author?: string;
    // New: Prompt & Keyword info
    promptUsed?: string;
    supervisor?: string;
}

// Mock Data: Scenario based
const PROPOSAL_DATA: ArticlePlan[] = [
    {
        id: 'p_new1',
        title: '【2024年夏】オフィスで浮かない「涼感ヨガウェア」おすすめ5選',
        theme: '季節のトレンド対策',
        targetKeyword: 'ヨガウェア 夏 オフィス',
        dataEvidence: {
            source: 'Trend',
            metric: '検索ボリューム急上昇',
            value: '+150%',
            description: '6月に入り「涼しい ヨガウェア」の検索が急増中。競合記事がまだ少ないため狙い目です。'
        },
        status: 'proposal'
    },
    {
        id: 'p_new2',
        title: '体が硬い人こそヨガ！インストラクターが教える最初のステップ',
        theme: '初心者へのバリア解消',
        targetKeyword: 'ヨガ 体が硬い 恥ずかしい',
        dataEvidence: {
            source: 'GSC',
            metric: '検索意図 (CTR改善)',
            value: 'High Potential',
            description: '「ヨガ 恥ずかしい」での流入があるが、直帰率が高い。安心させる導入記事が必要です。'
        },
        status: 'proposal'
    }
];

const PRODUCTION_DATA: ArticlePlan[] = [
    {
        id: 'a2', // DashboardのデータとIDを一致させる
        title: '瞑想を続けるための3つのコツ',
        theme: '習慣化のテクニック',
        targetKeyword: '瞑想 続かない',
        dataEvidence: {
            source: 'GA4',
            metric: '滞在時間',
            value: 'Top 5%',
            description: '瞑想関連の記事は滞在時間が長く、コンバージョンへの貢献度が高いトピックです。'
        },
        status: 'review',
        generatedAt: '2024-11-25 14:30',
        author: 'AI (Model-v4)',
        promptUsed: 'ヨガ記事執筆（初心者向け・共感重視） v2.4',
        supervisor: 'Mika Sensei'
    },
    {
        id: 'a1', // DashboardのデータとIDを一致させる
        title: '初心者向けヨガマットの選び方決定版',
        theme: '道具選びの基礎',
        targetKeyword: 'ヨガマット 選び方 厚さ',
        dataEvidence: {
            source: 'GSC',
            metric: '検索ボリューム',
            value: '12,000',
            description: '月間検索数が多いビッグワード。網羅的な記事でドメインパワーを底上げします。'
        },
        status: 'scheduled',
        scheduledFor: '2024-11-26 09:00',
        author: 'AI + Admin',
        promptUsed: 'SEO特化型 構成案作成 v1.1',
        supervisor: 'Admin'
    }
];

export function ContentPlanningView({ onEdit }: { onEdit: (id: string, title: string) => void }) {
    return (
        <div className="flex flex-col h-full bg-neutral-50/30">
            <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100/50 bg-white">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">企画・制作管理 (Content Planning)</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        データ分析に基づく記事企画の提案と、AI生成・承認フローを管理します。
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        <Database size={14} />
                        <span className="text-xs font-bold">連携データソース:</span>
                        <span className="text-xs">GSC, GA4, Ahrefs</span>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 px-8 py-8">
                <div className="max-w-5xl mx-auto space-y-10">
                    
                    {/* Section 1: AI Proposal */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                                <Sparkles className="text-amber-500" size={20} />
                                AI企画提案
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 ml-2">
                                    {PROPOSAL_DATA.length} 件の提案
                                </Badge>
                            </h3>
                            <span className="text-xs text-neutral-400">最終更新: 1時間前</span>
                        </div>

                        <div className="grid gap-4">
                            {PROPOSAL_DATA.map(plan => (
                                <Card key={plan.id} className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all">
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start gap-6">
                                            <div className="space-y-3 flex-1">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                                                        <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 font-medium">
                                                            {plan.theme}
                                                        </span>
                                                        <span>ターゲットKW: <span className="font-mono font-bold">{plan.targetKeyword}</span></span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-neutral-900 leading-tight">
                                                        {plan.title}
                                                    </h4>
                                                </div>
                                                
                                                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50 flex gap-3 items-start">
                                                    <div className="bg-white p-1.5 rounded border border-blue-100 text-blue-600 shrink-0 mt-0.5">
                                                        <TrendingUp size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-blue-700 flex items-center gap-2">
                                                            提案の根拠 ({plan.dataEvidence.source})
                                                            <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[10px]">{plan.dataEvidence.metric}: {plan.dataEvidence.value}</span>
                                                        </div>
                                                        <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                                                            {plan.dataEvidence.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <Button className="w-full bg-neutral-900 hover:bg-neutral-800 shadow-sm">
                                                    <Sparkles size={14} className="mr-2" />
                                                    この企画で生成
                                                </Button>
                                                <Button variant="outline" className="w-full text-neutral-500">
                                                    保留
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Production Pipeline */}
                    <section className="space-y-4 pt-4 border-t border-neutral-200">
                        <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                            <FileText className="text-blue-500" size={20} />
                            制作・承認フロー
                        </h3>

                        <div className="bg-neutral-100 p-1 rounded-lg grid grid-cols-3 gap-1 mb-4">
                            <div className="text-center py-1.5 text-xs font-bold text-neutral-600">生成中・執筆中</div>
                            <div className="text-center py-1.5 text-xs font-bold text-blue-600 bg-white rounded shadow-sm">承認待ち</div>
                            <div className="text-center py-1.5 text-xs font-bold text-neutral-600">予約済み</div>
                        </div>

                        <div className="grid gap-3">
                            {PRODUCTION_DATA.map(article => (
                                <div 
                                    key={article.id} 
                                    className={cn(
                                        "bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4",
                                        article.status === 'review' ? "border-blue-200 ring-1 ring-blue-100" : "border-neutral-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            article.status === 'review' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                                        )}>
                                            {article.status === 'review' ? <AlertCircle size={20} /> : <CalendarIcon size={20} />}
                                        </div>
                                        
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                {article.status === 'review' ? (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                        承認待ち
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                        予約済み: {article.scheduledFor}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                    <Bot size={12} /> 執筆者: {article.author}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-base font-bold text-neutral-900">{article.title}</h4>

                                            {/* Prompt Info */}
                                            {article.promptUsed && (
                                                <div className="flex items-center gap-3 text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded border border-neutral-100 inline-flex">
                                                    <div className="flex items-center gap-1">
                                                        <PenTool size={10} className="text-neutral-400" />
                                                        <span>プロンプト: </span>
                                                        <span className="font-medium text-neutral-700">{article.promptUsed}</span>
                                                    </div>
                                                    {article.supervisor && (
                                                        <>
                                                            <div className="w-px h-3 bg-neutral-200" />
                                                            <div className="flex items-center gap-1">
                                                                <User size={10} className="text-neutral-400" />
                                                                <span>監修: </span>
                                                                <span className="font-medium text-neutral-700">{article.supervisor}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {article.status === 'review' ? (
                                            <>
                                                <Button 
                                                    onClick={() => onEdit(article.id, article.title)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 shadow-lg"
                                                >
                                                    内容を確認・承認
                                                </Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" onClick={() => onEdit(article.id, article.title)}>
                                                編集して再予約
                                            </Button>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>生成ログを確認</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">削除</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
}
