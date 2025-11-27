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

import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface AnalyticsViewProps {
    onCreateArticle: (title: string) => void;
}

export function AnalyticsView({ onCreateArticle }: AnalyticsViewProps) {
  const [date, setDate] = useState<{ from: Date; to: Date } | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  return (
    <div className="flex flex-col h-full space-y-8">
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
        <OverviewTab />
      </div>
    </div>
  );
}

function OverviewTab() {
  const data = [
    { name: '3/1', pv: 4000, users: 2400, sessions: 2800 },
    { name: '3/2', pv: 3000, users: 1398, sessions: 1500 },
    { name: '3/3', pv: 2000, users: 9800, sessions: 10200 },
    { name: '3/4', pv: 2780, users: 3908, sessions: 4100 },
    { name: '3/5', pv: 1890, users: 4800, sessions: 5000 },
    { name: '3/6', pv: 2390, users: 3800, sessions: 4000 },
    { name: '3/7', pv: 3490, users: 4300, sessions: 4600 },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard 
          label="PV (ページビュー)" 
          value="124,592" 
          trend="+12.5%" 
          icon={<BarChart3 size={14} strokeWidth={1.5} />} 
        />
        <KpiCard 
          label="ユーザー数" 
          value="45,200" 
          trend="+5.2%" 
          icon={<Users size={14} strokeWidth={1.5} />} 
        />
        <KpiCard 
          label="平均セッション時間" 
          value="2m 14s" 
          trend="+18.0%" 
          icon={<Search size={14} strokeWidth={1.5} />} 
        />
        <KpiCard 
          label="直帰率" 
          value="42.8%" 
          trend="-0.1%" 
          icon={<MousePointerClick size={14} strokeWidth={1.5} />} 
          negative={false}
          trendColor="text-green-500" // Lower bounce rate is good
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
            <h3 className="font-medium text-xs text-neutral-900">トラフィック推移</h3>
            <div className="flex gap-2">
                <select className="text-xs border border-neutral-200 rounded px-2 py-1 outline-none focus:border-blue-400">
                    <option>ページビュー</option>
                    <option>ユーザー数</option>
                    <option>セッション</option>
                </select>
            </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#aaa'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#aaa'}} />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px'}}
              />
              <Area type="monotone" dataKey="pv" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Article Ranking */}
      <div className="bg-white rounded-lg border border-neutral-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-neutral-50 flex items-center justify-between">
            <h3 className="font-medium text-xs text-neutral-900">記事別パフォーマンス</h3>
            <Button variant="ghost" size="sm" className="text-[11px] text-neutral-400 hover:text-neutral-600 h-6">すべて見る <ArrowRight size={12} className="ml-1"/></Button>
        </div>
        <table className="w-full text-left">
            <thead className="text-[10px] text-neutral-400 font-medium bg-neutral-50/50">
                <tr>
                    <th className="px-5 py-2 font-medium">記事タイトル</th>
                    <th className="px-5 py-2 font-medium text-right">PV</th>
                    <th className="px-5 py-2 font-medium text-right">滞在時間</th>
                    <th className="px-5 py-2 font-medium text-right">CTR</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50 text-[11px]">
                {[
                    { title: "AI時代のブログ運用は「直感×分析」で勝つ", pv: 12400, time: "3:42", ctr: "4.2%" },
                    { title: "Next.js 14の新機能を徹底解説", pv: 8500, time: "2:15", ctr: "2.8%" },
                    { title: "SEOに強い記事構成のテンプレート配布", pv: 5400, time: "5:20", ctr: "8.5%" },
                    { title: "Figma to Code の実践的ワークフロー", pv: 3200, time: "4:10", ctr: "3.1%" },
                ].map((row, i) => (
                    <tr key={i} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-2.5 font-medium text-neutral-700">{row.title}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-neutral-500">{row.pv.toLocaleString()}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-neutral-500">{row.time}</td>
                        <td className="px-5 py-2.5 text-right font-mono text-neutral-500">{row.ctr}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
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
