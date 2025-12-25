import React from 'react';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';

interface MobileRestrictionViewProps {
    onBackToHome: () => void;
}

export function MobileRestrictionView({ onBackToHome }: MobileRestrictionViewProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 font-sans text-neutral-900 text-center">
            <div className="max-w-xs space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="relative mx-auto w-24 h-24 mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Monitor size={64} className="text-neutral-900" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full border-2 border-white">
                        <div className="bg-neutral-100 p-2 rounded-full">
                            <Smartphone size={20} className="text-neutral-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-xl font-bold tracking-tight">PCからアクセスしてください</h2>
                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                        この機能は複雑な操作を含むため、<br/>
                        スマートフォンでの利用は制限されています。<br/>
                        パソコンのブラウザからご利用ください。
                    </p>
                </div>

                <div className="pt-4">
                    <Button 
                        variant="outline" 
                        onClick={onBackToHome}
                        className="rounded-full border-neutral-200 font-bold"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        ホームに戻る
                    </Button>
                </div>
            </div>
        </div>
    );
}
