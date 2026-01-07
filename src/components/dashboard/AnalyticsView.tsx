'use client'

import React, { useState } from 'react';
import {
    BarChart3, TrendingUp, Lightbulb, ArrowRight, Search,
    Users, MousePointerClick, Zap, Calendar as CalendarIcon,
    PenTool, RefreshCw, ChevronDown
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { format, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { TaskSummaryCards } from './TaskSummaryCards';
import { AnalyticsDetailView } from './AnalyticsDetailView';
import { analyticsApi } from '../../lib/api';

interface AnalyticsViewProps {
    onCreateArticle: (title: string) => void;
    onNavigateToPosts: () => void;
    isMobile?: boolean;
}

export function AnalyticsView({ onCreateArticle, onNavigateToPosts, isMobile }: AnalyticsViewProps) {
    const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
    const [date, setDate] = useState<{ from: Date; to: Date } | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    if (viewMode === 'detail') {
        return <AnalyticsDetailView onBack={() => setViewMode('overview')} isMobile={isMobile} />;
    }

    return (
        <div className={cn(
            "flex flex-col space-y-8",
            isMobile ? "w-[93%] mx-auto py-6" : "w-full"
        )}>
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-100 pb-6">
                <div className="flex items-center gap-10">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">ホーム</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                size="sm"
                                className={cn(
                                    "w-[220px] justify-start text-left font-normal text-[11px] h-8",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y", { locale: ja })} -{" "}
                                            {format(date.to, "LLL dd, y", { locale: ja })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: ja })
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date as any} // range type mismatch workaround for demo
                                onSelect={(range: any) => setDate(range)}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </header>

            <div className="space-y-10">
                <OverviewTab
                    onNavigateToPosts={onNavigateToPosts}
                    onNavigateToDetail={() => setViewMode('detail')}
                />
            </div>
        </div>
    );
}

function OverviewTab({ onNavigateToPosts, onNavigateToDetail }: { onNavigateToPosts: () => void, onNavigateToDetail: () => void }) {
    const [metric, setMetric] = useState<'pv' | 'users' | 'sessions'>('pv');

    const { data: analyticsData, isLoading, isError } = useQuery({
        queryKey: ['analytics', 'overview', '30'],
        queryFn: () => analyticsApi.getOverview('30'),
    });

    const data = analyticsData?.data?.chartData || [];
    const overview = analyticsData?.data?.overview;
    const taskSummary = analyticsData?.data?.taskSummary;
    const ranking = analyticsData?.data?.ranking || [];

    const metricLabel = metric === 'pv' ? 'ページビュー' : metric === 'users' ? 'ユーザー数' : 'セッション';
    const metricColor = metric === 'pv' ? '#3b82f6' : metric === 'users' ? '#ec4899' : '#8b5cf6';

    if (isLoading) {
        return <div className="p-8 text-center text-neutral-500">データを読み込み中...</div>;
    }

    if (isError || !analyticsData?.data) {
        return (
            <div className="p-8 text-center text-neutral-500">
                <p>アナリティクスデータを取得できませんでした</p>
                <p className="text-xs mt-2">GA4の設定を確認してください</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <TaskSummaryCards
                draftCount={taskSummary?.draftCount || 0}
                reviewCount={taskSummary?.reviewCount || 0}
                scheduledCount={taskSummary?.scheduledCount || 0}
                publishedThisWeekCount={taskSummary?.publishedThisWeekCount || 0}
                scheduleTimes={["10:00", "14:00"]}
                onNavigateToDrafts={onNavigateToPosts}
                onNavigateToReviews={onNavigateToPosts}
            />

            {/* KPI Cards */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <BarChart3 size={16} />
                        主要指標サマリー
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onNavigateToDetail} className="text-xs text-neutral-500 h-7">レポート詳細 <ArrowRight size={12} className="ml-1" /></Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KpiCard
                        label="PV (ページビュー)"
                        value={overview?.pv.toLocaleString() || "0"}
                        trend="+12.5%"
                        icon={<BarChart3 size={14} strokeWidth={1.5} />}
                    />
                    <KpiCard
                        label="ユーザー数"
                        value={overview?.users.toLocaleString() || "0"}
                        trend="+5.2%"
                        icon={<Users size={14} strokeWidth={1.5} />}
                    />
                    <KpiCard
                        label="平均セッション時間"
                        value={overview?.avgSessionDuration || "0m 0s"}
                        trend="+18.0%"
                        icon={<Search size={14} strokeWidth={1.5} />}
                    />
                    <KpiCard
                        label="直帰率"
                        value={overview?.bounceRate || "0%"}
                        trend="-0.1%"
                        icon={<MousePointerClick size={14} strokeWidth={1.5} />}
                        negative={false}
                        trendColor="text-green-500"
                    />
                </div>
            </section>

            {/* Main Chart */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <TrendingUp size={16} />
                        トラフィック推移
                    </h3>
                    <div className="flex items-center gap-2">
                        <select className="text-xs bg-transparent border-none font-medium text-neutral-500 outline-none cursor-pointer hover:text-neutral-900 transition-colors">
                            <option>過去30日間</option>
                            <option>過去7日間</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={onNavigateToDetail} className="h-7 text-xs">詳細分析</Button>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: metricColor }} />
                                <span className="text-xs font-medium text-neutral-600">{metricLabel}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-50">
                                <div className="w-2 h-2 rounded-full bg-neutral-300" />
                                <span className="text-xs font-medium text-neutral-600">前期間</span>
                            </div>
                        </div>
                        <select
                            value={metric}
                            onChange={(e) => setMetric(e.target.value as any)}
                            className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 outline-none focus:border-neutral-900 bg-neutral-50"
                        >
                            <option value="pv">ページビュー</option>
                            <option value="users">ユーザー数</option>
                            <option value="sessions">セッション</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={metricColor} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={metricColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#aaa' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#aaa' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    cursor={{ stroke: '#f5f5f5', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey={metric} stroke={metricColor} strokeWidth={2} fillOpacity={1} fill="url(#colorMetric)" activeDot={{ r: 6, strokeWidth: 0 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Article Ranking */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                        <Lightbulb size={16} />
                        記事パフォーマンス・ランキング
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs text-neutral-500 h-7" onClick={onNavigateToPosts}>記事一覧へ <ArrowRight size={12} className="ml-1" /></Button>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="text-[10px] text-neutral-400 font-medium bg-neutral-50 border-b border-neutral-100">
                            <tr>
                                <th className="px-6 py-3 font-medium">記事タイトル</th>
                                <th className="px-6 py-3 font-medium text-right">PV</th>
                                <th className="px-6 py-3 font-medium text-right">滞在時間</th>
                                <th className="px-6 py-3 font-medium text-right">CTR</th>
                                <th className="px-4 py-3 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 text-xs">
                            {ranking.map((row, i) => (
                                <tr key={i} className="hover:bg-neutral-50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-neutral-700 group-hover:text-neutral-900 line-clamp-1 block">{row.title}</td>
                                    <td className="px-6 py-4 text-right font-mono text-neutral-600">{row.pv.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-neutral-600">{row.time}</td>
                                    <td className="px-6 py-4 text-right font-mono text-neutral-600">{row.ctr}</td>
                                    <td className="px-4 py-4 text-center">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-300 hover:text-neutral-900">
                                            <ArrowRight size={14} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {ranking.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">データがありません</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function KpiCard({ label, value, trend, icon, negative, trendColor }: { label: string, value: string, trend: string, icon: React.ReactNode, negative?: boolean, trendColor?: string }) {
    return (
        <div className="bg-white p-4 rounded-lg border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-neutral-500">{label}</span>
                <span className="text-neutral-300">{icon}</span>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-lg font-bold text-neutral-800 tracking-tight">{value}</span>
                <span className={cn("text-[10px] font-bold mb-1", trendColor ? trendColor : (negative ? 'text-red-500' : 'text-green-500'))}>
                    {trend}
                </span>
            </div>
        </div>
    )
}