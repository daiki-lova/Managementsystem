'use client'

import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/admin/lib/auth-context';

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
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                padding: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
                    padding: '40px 32px',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1
                        style={{
                            fontSize: '20px',
                            fontWeight: '600',
                            color: '#111827',
                            margin: '0 0 8px 0',
                        }}
                    >
                        管理画面ログイン
                    </h1>
                    <p
                        style={{
                            fontSize: '13px',
                            color: '#6b7280',
                            margin: 0,
                        }}
                    >
                        メディア管理システム
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Error Message */}
                    {displayError && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                marginBottom: '20px',
                            }}
                        >
                            <AlertCircle size={16} color="#dc2626" />
                            <span style={{ fontSize: '13px', color: '#dc2626' }}>{displayError}</span>
                        </div>
                    )}

                    {/* Email Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px',
                            }}
                        >
                            メールアドレス
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@radiance.jp"
                            disabled={isLoading}
                            autoComplete="email"
                            style={{
                                width: '100%',
                                height: '44px',
                                padding: '0 12px',
                                fontSize: '14px',
                                color: '#111827',
                                backgroundColor: '#ffffff',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#9ca3af';
                                e.target.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#d1d5db';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '28px' }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#374151',
                                marginBottom: '6px',
                            }}
                        >
                            パスワード
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="パスワードを入力"
                                disabled={isLoading}
                                autoComplete="current-password"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: '0 44px 0 12px',
                                    fontSize: '14px',
                                    color: '#111827',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#9ca3af';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(156, 163, 175, 0.2)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: '12px',
                                    transform: 'translateY(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '24px',
                                    height: '24px',
                                    padding: 0,
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    color: '#9ca3af',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#6b7280';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#9ca3af';
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#ffffff',
                            backgroundColor: isLoading ? '#4b5563' : '#111827',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = '#1f2937';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = '#111827';
                            }
                        }}
                    >
                        {isLoading ? (
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <>
                                ログイン
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <p
                        style={{
                            fontSize: '11px',
                            color: '#9ca3af',
                            margin: 0,
                        }}
                    >
                        ALIGN CMS
                    </p>
                </div>
            </div>

            {/* Keyframes for spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
