'use client'

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LoginView() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        await login('', '');
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4 font-sans text-neutral-900">
            <div className="w-full max-w-[520px] bg-white p-10 rounded-2xl shadow-sm border border-neutral-100 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold tracking-tight">管理画面ログイン</h1>
                    <p className="text-xs text-neutral-500">
                        開発モード
                    </p>
                </div>

                <div className="w-full max-w-[360px] mx-auto">
                    <Button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="flex items-center gap-2">
                                ログイン
                                <ArrowRight size={16} />
                            </span>
                        )}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-[10px] text-neutral-400">
                        Development Mode
                    </p>
                </div>
            </div>
        </div>
    );
}
