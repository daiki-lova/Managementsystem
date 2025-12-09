'use client'

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LoginView() {
    const { login, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!email.trim()) {
            setLocalError('メールアドレスを入力してください');
            return;
        }
        if (!password) {
            setLocalError('パスワードを入力してください');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
        } catch {
            // Error is handled by auth context
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4 font-sans text-neutral-900">
            <div className="w-full max-w-[520px] bg-white p-10 rounded-2xl shadow-sm border border-neutral-100 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-bold tracking-tight">管理画面ログイン</h1>
                    <p className="text-xs text-neutral-500">
                        ヨガメディア管理システム
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full max-w-[360px] mx-auto space-y-5">
                    {displayError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <AlertCircle size={16} />
                            <span>{displayError}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                            メールアドレス
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="owner@example.com"
                            className="h-11 border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400"
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                            パスワード
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="h-11 pr-10 border-neutral-200 focus:border-neutral-400 focus:ring-neutral-400"
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 text-sm mt-6"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                ログイン
                                <ArrowRight size={16} />
                            </span>
                        )}
                    </Button>
                </form>

                <div className="text-center">
                    <p className="text-[10px] text-neutral-400">
                        Yoga Media CMS
                    </p>
                </div>
            </div>
        </div>
    );
}
