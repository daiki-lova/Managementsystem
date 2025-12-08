'use client'

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Shield, ArrowRight } from 'lucide-react';

interface LoginViewProps {
    onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate API call
        setTimeout(() => {
            // Demo mode: Any input (or empty) is accepted
            onLogin();
        }, 800);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4 font-sans text-neutral-900">
            <div className="w-full max-w-[520px] bg-white p-10 rounded-2xl shadow-sm border border-neutral-100 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold tracking-tight">管理画面ログイン</h1>
                    <p className="text-xs text-neutral-500">
                        デモモード: 入力不要でログインできます
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[360px] mx-auto">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="メールアドレス"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-all text-sm"
                            />
                        </div>
                        {error && (
                            <p className="text-xs font-bold text-red-600 pl-1 animate-in slide-in-from-left-2">
                                {error}
                            </p>
                        )}
                    </div>

                    <Button 
                        type="submit" 
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
                </form>

                <div className="text-center">
                    <p className="text-[10px] text-neutral-400">
                        Authorized Personnel Only
                    </p>
                </div>
            </div>
        </div>
    );
}