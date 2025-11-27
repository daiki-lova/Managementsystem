import React from 'react';
import { 
    Search, TrendingUp, ArrowUpRight, Filter, 
    Download, Plus, MoreHorizontal, RefreshCw,
    CheckCircle2, Circle, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

// Types
interface KeywordData {
    id: string;
    keyword: string;
    volume: number;
    difficulty: number; // 0-100
    intent: 'Know' | 'Do' | 'Buy' | 'Go';
    status: 'untouched' | 'planned' | 'published';
    trend: number; // % change
    cpc?: number;
}

// Mock Data
const MOCK_KEYWORDS: KeywordData[] = [
    { id: 'k1', keyword: 'ヨガマット おすすめ 厚さ', volume: 12500, difficulty: 45, intent: 'Buy', status: 'published', trend: 12 },
    { id: 'k2', keyword: '瞑想 やり方 寝ながら', volume: 8900, difficulty: 25, intent: 'Do', status: 'planned', trend: 45 },
    { id: 'k3', keyword: 'ピラティス 効果 期間', volume: 5400, difficulty: 60, intent: 'Know', status: 'untouched', trend: -5 },
    { id: 'k4', keyword: 'ヨガ 初心者 恥ずかしい', volume: 3200, difficulty: 15, intent: 'Know', status: 'untouched', trend: 8 },
    { id: 'k5', keyword: 'ホットヨガ 服装 ユニクロ', volume: 6700, difficulty: 30, intent: 'Buy', status: 'untouched', trend: 20 },
    { id: 'k6', keyword: '産後ダイエット いつから', volume: 15000, difficulty: 75, intent: 'Know', status: 'untouched', trend: 5 },
    { id: 'k7', keyword: 'マインドフルネス とは 簡単', volume: 22000, difficulty: 65, intent: 'Know', status: 'planned', trend: 15 },
];

export function KeywordsView() {
    return (
        <div className="flex flex-col h-full bg-neutral-50/30">
            <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-100/50 bg-white">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800">キーワード戦略 (Keyword Strategy)</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                        SEOキーワードの分析と、記事化の進捗状況を管理します。
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm">
                        <RefreshCw size={14} className="mr-2" /> データ更新 (Ahrefs)
                    </Button>
                    <Button size="sm">
                        <Plus size={14} className="mr-2" /> キーワード追加
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input placeholder="キーワードを検索..." className="pl-9 h-9 bg-white" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Filter size={16} className="text-neutral-500" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">ステータス:</span>
                    <div className="flex gap-1">
                        <Badge variant="secondary" className="bg-white border border-neutral-200 font-normal text-neutral-600 cursor-pointer hover:bg-neutral-50">未着手 (4)</Badge>
                        <Badge variant="secondary" className="bg-white border border-neutral-200 font-normal text-neutral-600 cursor-pointer hover:bg-neutral-50">企画中 (2)</Badge>
                        <Badge variant="secondary" className="bg-white border border-neutral-200 font-normal text-neutral-600 cursor-pointer hover:bg-neutral-50">公開済 (1)</Badge>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden px-8 pb-8">
                <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-neutral-50/50 hover:bg-neutral-50/50">
                                <TableHead className="w-[300px]">キーワード</TableHead>
                                <TableHead className="w-[100px]">検索意図</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                                <TableHead className="text-center w-[100px]">難易度 (KD)</TableHead>
                                <TableHead className="text-right">Trend</TableHead>
                                <TableHead className="w-[120px]">ステータス</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_KEYWORDS.map((k) => (
                                <TableRow key={k.id} className="group">
                                    <TableCell className="font-medium text-neutral-900">
                                        {k.keyword}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] h-5 border-0 px-2 font-medium",
                                            k.intent === 'Know' ? "bg-blue-50 text-blue-700" :
                                            k.intent === 'Do' ? "bg-green-50 text-green-700" :
                                            k.intent === 'Buy' ? "bg-amber-50 text-amber-700" :
                                            "bg-purple-50 text-purple-700"
                                        )}>
                                            {k.intent}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-neutral-600">
                                        {k.volume.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className={cn(
                                            "inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold",
                                            k.difficulty < 30 ? "bg-green-100 text-green-700" :
                                            k.difficulty < 60 ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-700"
                                        )}>
                                            {k.difficulty}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className={cn(
                                            "flex items-center justify-end gap-1 text-xs font-medium",
                                            k.trend > 0 ? "text-green-600" : "text-neutral-400"
                                        )}>
                                            {k.trend > 0 ? <TrendingUp size={12} /> : null}
                                            {k.trend > 0 ? '+' : ''}{k.trend}%
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {k.status === 'published' && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                                    <CheckCircle2 size={14} /> 公開済
                                                </span>
                                            )}
                                            {k.status === 'planned' && (
                                                <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
                                                    <RefreshCw size={14} className="animate-spin" /> 企画中
                                                </span>
                                            )}
                                            {k.status === 'untouched' && (
                                                <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                                                    <Circle size={14} /> 未着手
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-400 hover:text-neutral-600">
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>企画を作成</DropdownMenuItem>
                                                <DropdownMenuItem>SERP分析を開く</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">削除</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
