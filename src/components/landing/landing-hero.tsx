'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GradientBars } from '../gradient-bars';
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr';

const LandingHero = () => {
    return (
        <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(160deg,#020617_8%,#0B1120_52%,#111827_100%)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#1F92F9]/25 blur-3xl" />
                <div className="absolute bottom-16 right-[10%] h-56 w-56 rounded-full bg-[#1F92F9]/20 blur-3xl" />
                <div className="absolute left-[8%] top-1/3 h-44 w-44 rounded-full bg-white/8 blur-2xl" />
            </div>

            <div className="absolute inset-0 opacity-55">
                <GradientBars
                    animation="wave"
                    duration={3.4}
                    colors={['#1F92F9', 'transparent']}
                />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pt-24 text-center md:pt-32">
                <span className="mb-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                    Built for creators who publish daily
                </span>

                <h1 className="mb-6 max-w-5xl font-serif-scotchdeck font-light text-5xl text-white md:text-6xl lg:text-7xl">
                    Your AI CMO
                    <br className="hidden sm:block" />
                    for consistent <XLogoIcon className='inline-flex items-center -mt-4' size={56} />                    growth
                </h1>

                <p className="mb-10 max-w-3xl text-base leading-7 text-white/75 md:text-xl md:leading-8">
                    Turn random thoughts into scheduled threads, punchy tweets, and repeatable campaigns.
                    ContentOSX helps you capture, refine, and ship content without losing your voice.
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href="/auth/sign-up">
                        <Button className="rounded-full bg-white px-7 py-6 text-base font-semibold text-slate-950 hover:bg-slate-100">
                            Start for Free
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="rounded-full border-white/40 bg-white/10 px-7 py-6 text-base font-semibold text-white hover:bg-white/20"
                    >
                        Watch Demo
                    </Button>
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
                    <span>Capture in 10 seconds</span>
                    <span>Plan in series, not chaos</span>
                    <span>Publish directly to X</span>
                </div>
            </div>

            {/* <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                    <path
                        d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z"
                        fill="white"
                    />
                </svg>
            </div> */}
        </section>
    );
};

export default LandingHero;