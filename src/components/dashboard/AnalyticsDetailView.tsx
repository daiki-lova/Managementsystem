import React, { useState } from 'react';
import { 
  ArrowLeft, Users, Smartphone, Globe, Layers, 
  TrendingUp, Download, Share2, Calendar, Filter,
  PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

// Mock Data for Details
const DEMOGRAPHICS_DATA = [
    { age: '18-24', male: 15, female: 25 },
    { age: '25-34', male: 35, female: 45 },
    { age: '35-44', male: 30, female: 35 },
    { age: '45-54', male: 20, female: 25 },
    { age: '55+', male: 10, female: 15 },
];

const DEVICE_DATA = [
    { name: 'Mobile', value: 65, color: '#171717' },
    { name: 'Desktop', value: 30, color: '#525252' },
    { name: 'Tablet', value: 5, color: '#a3a3a3' },
];

const SOURCE_DATA = [
    { name: 'Organic Search', value: 45, color: '#3b82f6' },
    { name: 'Social Media', value: 25, color: '#ec4899' },
    { name: 'Direct', value: 20, color: '#22c55e' },
    { name: 'Referral', value: 10, color: '#f59e0b' },
];

const USER_TYPE_DATA = [
    { name: '新規ユーザー', value: 62, color: '#171717' },
    { name: 'リピーター', value: 38, color: '#a3a3a3' },
];

interface AnalyticsDetailViewProps {
    onBack: () => void;
    isMobile?: boolean;
}

export function AnalyticsDetailView({ onBack, isMobile }: AnalyticsDetailViewProps) {
    const [period, setPeriod] = useState("30d");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-full hover:bg-neutral-100">
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">詳細レポート</h2>
                        <p className="text-xs text-neutral-500">ユーザー属性と行動の詳細分析</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] h-9 text-xs bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">過去7日間</SelectItem>
                            <SelectItem value="30d">過去30日間</SelectItem>
                            <SelectItem value="90d">過去3ヶ月</SelectItem>
                            <SelectItem value="1y">過去1年</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
                        <Download size={14} />
                        <span className="hidden md:inline">CSV出力</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="audience" className="w-full">
                <TabsList className="bg-neutral-100 p-1 h-10 mb-6 w-full md:w-auto flex overflow-x-auto">
                    <TabsTrigger value="audience" className="text-xs px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        ユーザー属性
                    </TabsTrigger>
                    <TabsTrigger value="acquisition" className="text-xs px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        集客・流入元
                    </TabsTrigger>
                    <TabsTrigger value="content" className="text-xs px-4 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        コンテンツ分析
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Audience */}
                <TabsContent value="audience" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* User Type */}
                        <Card className="bg-white shadow-sm border-neutral-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Users size={16} className="text-neutral-500" />
                                    新規 vs リピーター
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={USER_TYPE_DATA}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {USER_TYPE_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                        <span className="text-2xl font-bold text-neutral-900">62%</span>
                                        <span className="text-[10px] text-neutral-500">新規率</span>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-4 mt-2">
                                    {USER_TYPE_DATA.map((item, i) => (
                                        <div key={i} className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs text-neutral-600">{item.name} ({item.value}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Device Usage */}
                        <Card className="bg-white shadow-sm border-neutral-200">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Smartphone size={16} className="text-neutral-500" />
                                    デバイス比率
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 pt-2">
                                    {DEVICE_DATA.map((item, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="flex items-center gap-2">
                                                    {item.name === 'Mobile' && <Smartphone size={12} />}
                                                    {item.name === 'Desktop' && <TrendingUp size={12} />}
                                                    {item.name === 'Tablet' && <Layers size={12} />}
                                                    {item.name}
                                                </span>
                                                <span>{item.value}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full" 
                                                    style={{ width: `${item.value}%`, backgroundColor: item.color }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gender/Age */}
                        <Card className="bg-white shadow-sm border-neutral-200 md:col-span-1">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <PieChartIcon size={16} className="text-neutral-500" />
                                    年齢・性別分布
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={DEMOGRAPHICS_DATA}
                                            layout="vertical"
                                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                            barSize={12}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f5" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="age" type="category" tick={{fontSize: 10}} width={40} axisLine={false} tickLine={false} />
                                            <RechartsTooltip 
                                                 contentStyle={{borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                                 cursor={{fill: 'transparent'}}
                                            />
                                            <Bar dataKey="female" name="女性" stackId="a" fill="#f472b6" radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="male" name="男性" stackId="a" fill="#60a5fa" radius={[4, 0, 0, 4]} />
                                            <Legend iconSize={8} fontSize={10} wrapperStyle={{fontSize: '10px'}} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Metrics Table */}
                    <Card className="bg-white shadow-sm border-neutral-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">ユーザー詳細セグメント</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                                        <tr>
                                            <th className="px-4 py-3">インタレスト・カテゴリ</th>
                                            <th className="px-4 py-3 text-right">ユーザー数</th>
                                            <th className="px-4 py-3 text-right">構成比</th>
                                            <th className="px-4 py-3 text-right">CVR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {[
                                            { name: "美容・ウェルネス", users: "12,450", ratio: "28%", cvr: "2.4%" },
                                            { name: "フィットネス・ヨガ", users: "8,920", ratio: "20%", cvr: "3.8%" },
                                            { name: "ライフスタイル", users: "6,200", ratio: "14%", cvr: "1.2%" },
                                            { name: "キャリア・仕事", users: "4,500", ratio: "10%", cvr: "0.8%" },
                                            { name: "メンタルヘルス", users: "3,800", ratio: "8%", cvr: "1.5%" },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-neutral-50/50">
                                                <td className="px-4 py-3 font-medium text-neutral-700">{row.name}</td>
                                                <td className="px-4 py-3 text-right text-neutral-600">{row.users}</td>
                                                <td className="px-4 py-3 text-right text-neutral-600">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-neutral-400" style={{ width: row.ratio }} />
                                                        </div>
                                                        <span className="w-8">{row.ratio}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-neutral-600">{row.cvr}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Acquisition */}
                <TabsContent value="acquisition" className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-white shadow-sm border-neutral-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">チャネル別流入割合</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={SOURCE_DATA}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {SOURCE_DATA.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-sm border-neutral-200">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold">日次チャネル推移</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                { name: 'Mon', organic: 400, social: 240, direct: 240 },
                                                { name: 'Tue', organic: 300, social: 139, direct: 221 },
                                                { name: 'Wed', organic: 200, social: 980, direct: 229 },
                                                { name: 'Thu', organic: 278, social: 390, direct: 200 },
                                                { name: 'Fri', organic: 189, social: 480, direct: 218 },
                                                { name: 'Sat', organic: 239, social: 380, direct: 250 },
                                                { name: 'Sun', organic: 349, social: 430, direct: 210 },
                                            ]}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                            stackOffset="expand"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                            <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={(v) => `${v * 100}%`} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip />
                                            <Bar dataKey="organic" name="検索" stackId="a" fill="#3b82f6" />
                                            <Bar dataKey="social" name="SNS" stackId="a" fill="#ec4899" />
                                            <Bar dataKey="direct" name="直接" stackId="a" fill="#22c55e" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </TabsContent>

                {/* Tab 3: Content */}
                <TabsContent value="content">
                    <Card className="bg-white shadow-sm border-neutral-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold">記事パフォーマンス詳細</CardTitle>
                            <Button variant="outline" size="sm" className="h-7 text-xs">全データのエクスポート</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-neutral-400 text-xs">
                                コンテンツの詳細分析データがここに表示されます
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}