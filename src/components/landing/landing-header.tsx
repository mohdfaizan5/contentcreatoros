'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Logo from '@/components/logo';

type NavTheme = 'light' | 'dark';

const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#templates', label: 'Templates' },
    { href: '#series', label: 'Series' },
    { href: '#faq', label: 'FAQ' },
];

const LandingHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [navTheme, setNavTheme] = useState<NavTheme>('dark');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const updateNavTheme = () => {
            const markerY = 92;
            const sections = Array.from(
                document.querySelectorAll<HTMLElement>('[data-nav-theme]'),
            );

            if (sections.length === 0) {
                setIsScrolled(window.scrollY > 8);
                return;
            }

            const activeSection =
                sections.find((section) => {
                    const rect = section.getBoundingClientRect();
                    return rect.top <= markerY && rect.bottom > markerY;
                }) ??
                sections.reduce((nearest, section) => {
                    const currentDelta = Math.abs(section.getBoundingClientRect().top - markerY);
                    const nearestDelta = Math.abs(nearest.getBoundingClientRect().top - markerY);
                    return currentDelta < nearestDelta ? section : nearest;
                }, sections[0]);

            setNavTheme(activeSection.dataset.navTheme === 'light' ? 'light' : 'dark');
            setIsScrolled(window.scrollY > 8);
        };

        updateNavTheme();
        window.addEventListener('scroll', updateNavTheme, { passive: true });
        window.addEventListener('resize', updateNavTheme);

        return () => {
            window.removeEventListener('scroll', updateNavTheme);
            window.removeEventListener('resize', updateNavTheme);
        };
    }, []);

    const isLight = navTheme === 'light';

    return (
        <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 md:px-6">
            <nav
                className={cn(
                    'mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-3 py-2 backdrop-blur-xl transition-all duration-300',
                    isLight
                        ? 'border-border/5 bg-white/88 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.55)]'
                        : 'border-white/5 bg-slate-950/55 shadow-[0_10px_35px_-20px_rgba(2,6,23,0.85)]',
                    isScrolled ? 'md:py-2' : 'md:py-3',
                )}
            >
                <Logo
                    full
                    height={28}
                    width={28}
                    className='flex  items-center'
                    textClassName={cn(
                        'font-medium transition-colors',
                        isLight ? 'text-slate-950' : 'text-white',
                    )}
                />

                <div
                    className={cn(
                        'hidden items-center gap-1 rounded-full border p-1 md:flex',
                        isLight ? 'border-border/40 bg-slate-100/80' : 'border-white/20 bg-white/10',
                    )}
                >
                    {navItems.map((item, index) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                index === 0
                                    ? isLight
                                        ? 'bg-slate-950 text-white'
                                        : 'bg-white text-slate-950'
                                    : isLight
                                        ? 'text-slate-700 hover:bg-white'
                                        : 'text-white/85 hover:bg-white/15 hover:text-white',
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <Link
                        href="/auth/login"
                        className={cn(
                            'text-sm font-semibold transition-colors hover:underline',
                            isLight ? 'text-slate-950' : 'text-white',
                        )}
                    >
                        Log In
                    </Link>
                    <Link href="/auth/sign-up">
                        <Button
                            className={cn(
                                'rounded-full px-6 py-2 font-semibold',
                                isLight
                                    ? 'bg-slate-950 text-white hover:bg-slate-800'
                                    : 'bg-white text-slate-950 hover:bg-slate-100',
                            )}
                        >
                            Start Creating
                            <span
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-full',
                                    isLight ? 'bg-white/20' : 'bg-slate-950',
                                )}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M5 12H19M19 12L12 5M19 12L12 19"
                                        stroke="white"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        </Button>
                    </Link>
                </div>

                <button
                    className={cn(
                        'p-2 md:hidden',
                        isLight ? 'text-slate-950' : 'text-white',
                    )}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {isMenuOpen ? (
                            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        ) : (
                            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                    </svg>
                </button>
            </nav>

            {isMenuOpen && (
                <div
                    className={cn(
                        'absolute left-4 right-4 top-full rounded-2xl border p-4 shadow-xl backdrop-blur-xl md:hidden',
                        isLight
                            ? 'border-border/40 bg-white/95 text-slate-900'
                            : 'border-white/20 bg-slate-950/90 text-white',
                    )}
                >
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    'rounded-lg px-4 py-3 text-sm font-semibold transition-colors',
                                    isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10',
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <hr className={cn('my-2', isLight ? 'border-border/40' : 'border-white/20')} />
                        <Link
                            href="/auth/login"
                            onClick={() => setIsMenuOpen(false)}
                            className={cn(
                                'rounded-lg px-4 py-3 text-center text-sm font-semibold',
                                isLight ? 'hover:bg-slate-100' : 'hover:bg-white/10',
                            )}
                        >
                            Log In
                        </Link>
                        <Link href="/auth/sign-up">
                            <Button
                                className={cn(
                                    'w-full rounded-lg py-3 font-semibold',
                                    isLight
                                        ? 'bg-slate-950 text-white hover:bg-slate-800'
                                        : 'bg-white text-slate-950 hover:bg-slate-100',
                                )}
                            >
                                Start Creating
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
};

export default LandingHeader;

