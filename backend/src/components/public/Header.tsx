'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const CATEGORIES = [
  { label: 'YOGA', slug: 'yoga' },
  { label: 'PILATES', slug: 'pilates' },
  { label: 'DIET', slug: 'diet' },
  { label: 'JOB', slug: 'job' },
  { label: 'BEAUTY', slug: 'beauty' },
  { label: 'LIFE', slug: 'life' },
  { label: 'SPORTS', slug: 'sports' },
  { label: 'SIDE BUSINESS', slug: 'side-business' },
  { label: 'SKILLS', slug: 'skills' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const designWidth = 1680;

  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth;
      setScale(Math.min(1, viewportWidth / designWidth));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] hidden md:block w-full">
        <div
          className="mx-auto"
          style={{
            width: Math.min(typeof window !== 'undefined' ? window.innerWidth : designWidth, designWidth),
          }}
        >
          <div
            className="origin-top-left"
            style={{
              transform: `scale(${scale})`,
              width: designWidth,
              transformOrigin: 'top left',
            }}
          >
            <div className="absolute h-[50px] left-0 top-0 w-[1680px]">
              <div className="absolute bg-white h-[160px] left-0 right-0 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] top-[calc(50%+55px)] translate-y-[-50%]">
                {/* Logo Section */}
                <div className="absolute h-[112px] left-0 right-[0.02px] top-0">
                  <div aria-hidden="true" className="absolute border-[#e0e0e0] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />

                  {/* Menu Button */}
                  <button
                    onClick={() => setIsMenuOpen(true)}
                    className="absolute left-[24px] top-[48px] p-2 hover:bg-gray-100 rounded"
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
                  <div className="absolute inset-[21px_688px_21px_687.98px]">
                    <Link
                      href="/"
                      className="absolute h-[70px] left-1/2 overflow-clip top-0 translate-x-[-50%] w-[300px] cursor-pointer"
                    >
                      <div className="absolute h-[70px] left-0 overflow-clip top-0 w-[300px] flex flex-col items-center justify-center">
                        <Image
                          src="/images/logo-header.png"
                          alt="Radiance Logo"
                          width={200}
                          height={50}
                          className="h-[50px] w-auto mb-1"
                        />
                        <p className="text-black text-[9px] tracking-[1px] whitespace-nowrap font-[var(--font-noto-sans-jp)]">
                          心と体を輝かせるライフスタイルマガジン
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="absolute h-[48px] left-[calc(50%-0.01px)] overflow-clip top-[112px] translate-x-[-50%] w-[674.77px]">
                  <div className="absolute h-[14.77px] left-0 top-[16.61px] right-0 flex items-center justify-between gap-3">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/${cat.slug}`}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      >
                        <span className="font-bold text-[12px] text-black tracking-[1.662px] uppercase font-[var(--font-noto-sans)]">
                          {cat.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm md:hidden">
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#e0e0e0]">
          <button
            onClick={() => setIsMenuOpen(true)}
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
            <Image
              src="/images/logo-header.png"
              alt="Radiance Logo"
              width={100}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          <div className="w-6" />
        </div>

        {/* Mobile Navigation */}
        <nav className="overflow-x-auto border-b border-[#e0e0e0] bg-white">
          <div className="flex gap-4 px-4 py-3 whitespace-nowrap min-w-max">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="font-bold text-[10px] tracking-[1.2px] uppercase hover:opacity-70 transition-opacity font-[var(--font-noto-sans)]"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Sidebar Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className="fixed top-0 left-0 h-full bg-white z-[9999] shadow-2xl w-[320px] max-w-[85vw] animate-in slide-in-from-left"
          >
            <div className="flex flex-col h-full">
              <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-black tracking-[2px] uppercase font-bold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="black" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto">
                <ul className="py-4">
                  <li>
                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-left px-6 py-4 text-black hover:bg-gray-100 transition-colors tracking-[1.5px] uppercase border-b border-gray-100"
                    >
                      Home
                    </Link>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/${cat.slug}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block w-full text-left px-6 py-4 text-black hover:bg-gray-100 transition-colors tracking-[1.5px] uppercase border-b border-gray-100"
                      >
                        {cat.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-t border-gray-200 p-6">
                <p className="text-gray-500 text-[10px] tracking-[1px] uppercase">
                  &copy; 2025 Radiance
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
