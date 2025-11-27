import React from 'react';
import { Button } from '../ui/button';

interface WritingViewProps {
    onCreateArticle: (data: { title: string; status: 'draft' | 'scheduled'; publishedAt?: string }) => void;
}

export function WritingView({ onCreateArticle }: WritingViewProps) {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-neutral-800">AI Writing Assistant</h2>
            <p className="text-neutral-500 max-w-md">
                AIを活用して記事を作成・編集します。<br/>
                左側のメニューから新規作成するか、既存の記事を選択してください。
            </p>
            <Button onClick={() => onCreateArticle({ title: '新規AI記事', status: 'draft' })}>
                新規作成
            </Button>
        </div>
    );
}
