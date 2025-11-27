import React, { useState } from 'react';
import { 
    FileText, Layout, Type, ArrowLeft, Save, Plus
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from "../ui/avatar";

// Types
interface Prompt {
    id: string;
    title: string;
    description: string;
    category: 'writing' | 'structure' | 'title';
    content?: string;
    version: string;
    lastUpdated: string;
}

const MOCK_PROMPTS: Prompt[] = [
    {
        id: 'p1',
        title: '初心者向け・共感重視ライティング',
        description: '専門用語を避け、読者の不安に寄り添うトーンで執筆します。',
        category: 'writing',
        content: `あなたはプロのヨガインストラクター兼ライターです。
ターゲット読者は「ヨガを始めたいが、体が硬い・恥ずかしい」と感じている30代女性です。

# 制約条件
- 専門用語は使わず、中学生でもわかる言葉に言い換えること
- 「〜です・ます」調で、親しみやすいトーンを維持すること
- 読者の悩みに共感するフレーズを各セクションの冒頭に入れること
- 具体的な体の動きを表現する際は、擬音語や日常動作に例えること

# 禁止事項
- 断定的な医療アドバイス（「治る」など）
- 精神論のみの解説
- 1文が長すぎる文章（60文字以内で区切る）`,
        version: '2.4',
        lastUpdated: '2024-11-20',
    },
    {
        id: 'p2',
        title: 'SEO特化型・網羅的構成案',
        description: '上位表示を狙うためのH2/H3構成を作成します。検索意図を深く分析。',
        category: 'structure',
        content: `指定されたキーワードに基づいて、検索意図（インサイト）を満たす記事構成案を作成してください。

# 出力形式
## タイトル案（3つ）
- [案1]
- [案2]
- [案3]

## 構成案
### H2: [見出し]
- H3: [小見出し]
  - 本文の要旨（箇条書き）
- H3: [小見出し]
  - 本文の要旨（箇条書き）

### H2: [見出し]...

# 評価基準
- 上位10記事の網羅性を含んでいるか
- 独自性（オリジナリティ）のある見出しが含まれているか
- 読者が次に知りたいこと（再検索防止）が含まれているか`,
        version: '1.1',
        lastUpdated: '2024-10-15',
    },
    {
        id: 'p3',
        title: 'クリック率重視タイトル生成',
        description: '数字やパワーワードを使い、CTRを高めるタイトルを5案出します。',
        category: 'title',
        content: `以下の記事テーマに対して、クリック率（CTR）を最大化するタイトルを5つ提案してください。

# 条件
- 32文字以内であること
- 数字を含めること（例: 3選、5つのコツ）
- 「【】」などの隅付き括弧を使用して強調すること
- ターゲットへのベネフィットが明確であること

# ターゲット
- ヨガ初心者
- 忙しい主婦
- 運動不足の会社員`,
        version: '3.0',
        lastUpdated: '2024-11-24',
    },
    {
        id: 'p4',
        title: '解剖学的アプローチ（理学療法士監修）',
        description: '筋肉や骨格の動きを正確に解説する専門的な記事用プロンプト。',
        category: 'writing',
        content: `理学療法士の視点から、以下のポーズにおける筋肉と骨格の動きを解説してください。

# 必須項目
- 主働筋（メインで使われる筋肉）
- 拮抗筋（反対の動きをする筋肉）
- 関節の動き（屈曲、伸展、回旋など）
- 怪我のリスクと回避方法

# 注意点
- 正確な解剖学用語を使用しつつ、カッコ書きで一般名称を添えること
  例: 上腕二頭筋（力こぶの筋肉）
- エビデンスに基づかない効果効能は記載しないこと`,
        version: '1.0',
        lastUpdated: '2024-11-01',
    }
];

export function PromptsView() {
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

    const handleCreate = () => {
        const newPrompt: Prompt = {
            id: `new-${Date.now()}`,
            title: '新しいプロンプト',
            description: '',
            category: 'writing',
            content: '',
            version: '1.0',
            lastUpdated: 'Draft',
        };
        setSelectedPrompt(newPrompt);
    };

    if (selectedPrompt) {
        return (
            <PromptEditor 
                prompt={selectedPrompt} 
                onBack={() => setSelectedPrompt(null)} 
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-white text-neutral-900 font-sans">
            {/* Header Area - Fixed height and alignment */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-900">プロンプト設定</h1>
                    <p className="text-xs text-neutral-500 font-medium">生成AIの品質基準とトーン＆マナー定義</p>
                </div>
                <div>
                    <Button 
                        onClick={handleCreate} 
                        className="h-12 px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm"
                    >
                        新規作成
                    </Button>
                </div>
            </header>

            {/* Main Content Wrapper - Centered with max-width */}
            <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col min-h-0">
                
                {/* List Header */}
                <div className="flex-none grid grid-cols-12 gap-4 px-8 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider select-none border-b border-neutral-100/50">
                    <div className="col-span-9 pl-2">プロンプト名 / 説明</div>
                    <div className="col-span-2">カテゴリ</div>
                    <div className="col-span-1 text-right pr-2">更新日</div>
                </div>

                {/* List Content */}
                <ScrollArea className="flex-1">
                    <div className="px-4 pb-20 pt-2">
                        {MOCK_PROMPTS.map(prompt => (
                            <div 
                                key={prompt.id} 
                                onClick={() => setSelectedPrompt(prompt)}
                                className="group grid grid-cols-12 gap-4 px-4 py-5 items-start hover:bg-neutral-50 rounded-2xl transition-colors cursor-pointer border border-transparent mb-0.5"
                            >
                                
                                {/* Title & Description */}
                                <div className="col-span-9 pr-4">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            prompt.category === 'writing' ? "bg-blue-400" :
                                            prompt.category === 'structure' ? "bg-purple-400" : "bg-amber-400"
                                        )} />
                                        <h3 className="font-bold text-neutral-900 text-sm leading-none group-hover:text-blue-600 transition-colors">{prompt.title}</h3>
                                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">v{prompt.version}</span>
                                    </div>
                                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 font-medium">
                                        {prompt.description}
                                    </p>
                                </div>

                                {/* Category */}
                                <div className="col-span-2 pt-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-white rounded-full text-neutral-400 border border-neutral-100">
                                            {prompt.category === 'writing' && <FileText size={16} />}
                                            {prompt.category === 'structure' && <Layout size={16} />}
                                            {prompt.category === 'title' && <Type size={16} />}
                                        </div>
                                        <span className="text-[11px] font-bold text-neutral-600 capitalize">
                                            {prompt.category === 'writing' ? '本文執筆' : 
                                             prompt.category === 'structure' ? '記事構成' : 'タイトル'}
                                        </span>
                                    </div>
                                </div>

                                {/* Last Updated */}
                                <div className="col-span-1 pt-2.5 text-right pr-2">
                                    <span className="text-[11px] text-neutral-400 font-medium tabular-nums">
                                        {prompt.lastUpdated}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}

function PromptEditor({ prompt, onBack }: { prompt: Prompt; onBack: () => void }) {
    return (
        <div className="flex flex-col h-full bg-white text-neutral-900 font-sans">
            {/* Header */}
            <header className="h-24 flex-none px-8 flex items-end justify-between pb-6 bg-white border-b border-neutral-100">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onBack}
                        className="rounded-full hover:bg-neutral-100 -ml-2"
                    >
                        <ArrowLeft size={20} className="text-neutral-500" />
                    </Button>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-xl font-bold tracking-tight text-neutral-900">{prompt.title}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500">ID: {prompt.id}</span>
                            <span className="text-xs text-neutral-400 font-medium">v{prompt.version}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={onBack}
                        className="h-12 px-8 rounded-full bg-neutral-900 text-white font-bold hover:bg-neutral-800 shadow-sm flex items-center gap-2"
                    >
                        <Save size={16} />
                        保存して戻る
                    </Button>
                </div>
            </header>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden flex">
                <div className="flex-1 h-full overflow-y-auto">
                    <div className="max-w-[1000px] mx-auto px-8 py-10 space-y-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500">プロンプト名</Label>
                                <Input defaultValue={prompt.title} className="font-bold bg-neutral-50 border-0 focus:bg-white focus:ring-2 focus:ring-neutral-100" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500">カテゴリ</Label>
                                <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-md text-sm font-medium text-neutral-700">
                                    {prompt.category === 'writing' && <FileText size={16} className="text-blue-500" />}
                                    {prompt.category === 'structure' && <Layout size={16} className="text-purple-500" />}
                                    {prompt.category === 'title' && <Type size={16} className="text-amber-500" />}
                                    <span className="capitalize">{prompt.category}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-neutral-500">説明</Label>
                            <Input defaultValue={prompt.description} className="bg-neutral-50 border-0 focus:bg-white focus:ring-2 focus:ring-neutral-100" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-neutral-500">システムプロンプト</Label>
                            <div className="relative rounded-xl overflow-hidden border border-neutral-200 shadow-sm focus-within:ring-2 focus-within:ring-neutral-100 focus-within:border-neutral-300 transition-all">
                                <Textarea 
                                    className="min-h-[400px] font-mono text-sm leading-relaxed resize-none border-0 p-6 bg-neutral-50/30 focus:bg-white"
                                    defaultValue={prompt.content || ''}
                                    placeholder="ここにAIへの指示を入力してください..."
                                />
                            </div>
                            <p className="text-[11px] text-neutral-400 text-right">
                                変数: {'{{keyword}}'}, {'{{target}}'}, {'{{tone}}'} が使用可能です
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}