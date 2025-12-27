'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

import { Category } from '@/lib/public-types';

interface HeaderProps {
  categories?: Category[];
  onToggleMenu?: () => void;
}

export function Header({ categories = [], onToggleMenu }: HeaderProps) {
  // スケーリングと固定幅のロジックを削除

  // メニューの開閉状態管理は親コンポーネントまたは共有の状態に集約されました。

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] hidden md:block w-full bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)]">
        <div className="w-full flex flex-col">
          {/* Logo Section */}
          <div className="h-[112px] flex items-center justify-center relative px-6">
            {/* Menu Button */}
            <button
              onClick={onToggleMenu}
              className="absolute left-[24px] p-2 hover:bg-gray-100 rounded"
              aria-label="Open menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path
                  clipRule="evenodd"
                  fillRule="evenodd"
                  fill="black"
                  d="M0 2h16v1.5H0V2zm0 6.25h16v1.5H0v-1.5zm16 6.25H0v1.5h16v-1.5z"
                />
              </svg>
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <img
                src="/images/logo-header.png"
                alt="Radiance Logo"
                className="h-[50px] w-auto mb-1"
              />
              <p className="text-black text-[9px] tracking-[1px] whitespace-nowrap font-[var(--font-noto-sans-jp)]">
                心と体を輝かせるライフスタイルマガジン
              </p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="h-[48px] flex items-center justify-between border-b border-[#e0e0e0] px-12">
            <div className="flex items-center gap-12 w-full justify-center overflow-x-auto no-scrollbar">
              {categories.slice(0, 9).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${cat.slug}`}
                  className="cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap"
                >
                  <span className="font-bold text-[12px] text-black tracking-[1.662px] uppercase font-[var(--font-noto-sans)]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm md:hidden w-full">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#e0e0e0]">
          <button
            onClick={onToggleMenu}
            className="w-6 h-6"
            aria-label="Open menu"
          >
            <svg className="w-full h-full" fill="none" viewBox="0 0 16 16">
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                fill="black"
                d="M0 2h16v1.5H0V2zm0 6.25h16v1.5H0v-1.5zm16 6.25H0v1.5h16v-1.5z"
              />
            </svg>
          </button>

          <Link href="/" className="cursor-pointer">
            <img
              src="/images/logo-header.png"
              alt="Radiance Logo"
              className="h-8 w-auto"
            />
          </Link>

          <div className="w-6" />
        </div>

        {/* Mobile Navigation */}
        <nav className="overflow-x-auto border-b border-[#e0e0e0] bg-white">
          <div className="flex gap-4 px-4 py-3 whitespace-nowrap min-w-max">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="font-bold text-[10px] text-black tracking-[1.2px] uppercase hover:opacity-70 transition-opacity font-[var(--font-noto-sans)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Sidebar Menu rendering moved to Layout/Page level for consistency */}
    </>
  );
}
