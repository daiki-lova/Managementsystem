"use client";

import { useState, useEffect } from 'react';
import { Category } from '@/lib/public-types';

interface SidebarMenuProps {
  onNavigate: (page: string, category?: string) => void;
  scale: number;
  categories?: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarMenu({ onNavigate, scale, categories = [], isOpen, onClose }: SidebarMenuProps) {
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // サイドバーの幅を計算
  useEffect(() => {
    const updateWidth = () => {
      setSidebarWidth(Math.min(320, window.innerWidth * 0.85));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // メニューが開いているときにスクロールを防止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ハンバーガーボタンのクリック検知は親コンポーネントで行うため、削除しました。

  const menuItems = categories.length > 0
    ? categories.map(cat => ({ label: cat.name, category: cat.slug }))
    : [
      { label: 'Yoga', category: 'yoga' },
      { label: 'Pilates', category: 'pilates' },
      { label: 'Diet', category: 'diet' },
      { label: 'Job', category: 'job' },
      { label: 'Beauty', category: 'beauty' },
      { label: 'Life', category: 'life' },
      { label: 'Sports', category: 'sports' },
      { label: 'Side Business', category: 'side-business' },
      { label: 'Skill', category: 'skill' },
    ];

  const handleMenuItemClick = (category: string) => {
    onClose();
    onNavigate('category', category);
  };

  const handleHomeClick = () => {
    onClose();
    onNavigate('home');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />

      {/* サイドバーメニュー - 左から右にスライド */}
      <div
        className="fixed top-0 left-0 h-full bg-white z-[9999] shadow-2xl transition-transform duration-300 ease-in-out animate-slide-in-left"
        style={{ width: sidebarWidth }}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-black tracking-[2px] uppercase">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="black"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* メニューアイテム */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="py-4">
              <li>
                <button
                  onClick={handleHomeClick}
                  className="w-full text-left px-6 py-4 text-black hover:bg-gray-100 transition-colors tracking-[1.5px] uppercase border-b border-gray-100"
                >
                  Home
                </button>
              </li>
              {menuItems.map((item) => (
                <li key={item.category}>
                  <button
                    onClick={() => handleMenuItemClick(item.category)}
                    className="w-full text-left px-6 py-4 text-black hover:bg-gray-100 transition-colors tracking-[1.5px] uppercase border-b border-gray-100"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* フッター */}
          <div className="border-t border-gray-200 p-6">
            <p className="text-gray-700 text-[10px] tracking-[1px] uppercase">
              © 2025 ALIGN
            </p>
          </div>
        </div>
      </div>
    </>
  );
}