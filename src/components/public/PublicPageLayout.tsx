'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { Category } from '@/lib/public-types';

interface PublicPageLayoutProps {
    children: React.ReactNode;
    categories: Category[];
}

function SidebarMenu({
    isOpen,
    onClose,
    categories,
}: {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
}) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-[200]"
                onClick={onClose}
            />
            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-full w-[280px] bg-white z-[201] shadow-xl overflow-y-auto">
                <div className="p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <Link href="/" onClick={onClose} className="block mb-8">
                        <img
                            src="/images/logo-header.png"
                            alt="ALIGN Logo"
                            className="h-10 w-auto"
                        />
                    </Link>

                    <nav className="space-y-4">
                        <Link
                            href="/"
                            onClick={onClose}
                            className="block font-bold text-[12px] text-black tracking-[1.5px] uppercase hover:opacity-70 transition-opacity font-[var(--font-noto-sans)]"
                        >
                            Home
                        </Link>
                        {categories.map((cat) => (
                            <Link
                                key={cat.slug}
                                href={`/${cat.slug}`}
                                onClick={onClose}
                                className="block font-bold text-[12px] text-black tracking-[1.5px] uppercase hover:opacity-70 transition-opacity font-[var(--font-noto-sans)]"
                            >
                                {cat.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </>
    );
}

export function PublicPageLayout({ children, categories }: PublicPageLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="w-full bg-white min-h-screen flex flex-col">
            <SidebarMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                categories={categories}
            />
            <Header
                categories={categories}
                onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
            />

            <div className="flex-1">
                {children}
            </div>

            <Footer categories={categories} />
        </div>
    );
}
