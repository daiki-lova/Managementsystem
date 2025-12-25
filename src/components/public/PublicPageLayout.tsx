'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import SidebarMenu from '@/components/public/figma/SidebarMenu';
import { Category } from '@/lib/public-types';

interface PublicPageLayoutProps {
    children: React.ReactNode;
    categories: Category[];
}

export function PublicPageLayout({ children, categories }: PublicPageLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // スケーリングロジックを削除
    const router = useRouter();

    const handleNavigate = (page: string, category?: string) => {
        setIsMenuOpen(false);
        if (page === 'home') {
            router.push('/');
        } else if (page === 'category' && category) {
            router.push(`/${category}`);
        }
    };

    return (
        <div className="w-full bg-white min-h-screen flex flex-col">
            <SidebarMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={handleNavigate}
                scale={1}
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
