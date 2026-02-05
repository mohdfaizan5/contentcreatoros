'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const LandingHero = () => {
    return (
        <section className="relative min-h-screen bg-vaultx-hero overflow-hidden pt-20">
            {/* Cloud/Sky decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating clouds */}
                <div className="absolute top-20 left-10 w-32 h-16 bg-white/30 rounded-full blur-xl animate-float-slow" />
                <div className="absolute top-32 right-20 w-48 h-24 bg-white/20 rounded-full blur-2xl animate-float animation-delay-1000" />
                <div className="absolute top-60 left-1/4 w-24 h-12 bg-white/25 rounded-full blur-lg animate-float-reverse" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24">
                {/* Hero Text */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl  lg:text-7xl font-semibold text-white mb-4 leading-[2.8rem] md:leading-[3.7rem]">
                        <span className="">From raw ideas to </span>
                        <br className='hidden lg:block' />
                        consistent content
                    </h1>
                    <p className="text-white/80 leading-5 md:leading-6 text-lg md:text-xl max-w-2xl mx-auto mb-8">
                        A daily-use system for solo creators and small teams to
                        <br className="hidden md:block" />
                        capture ideas, plan content, and think in series.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link href="/auth/sign-up">
                            <Button
                                className="bg-[#000100] text-white hover:bg-gray-800 rounded-full px-6 py-5 font-medium flex items-center gap-2 shadow-lg"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                Start for Free
                            </Button>
                        </Link>
                        <Button
                            className="bg-[#1F92F9] text-white hover:bg-[#1a7dd6] rounded-full px-6 py-5 font-medium flex items-center gap-2 shadow-lg"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Watch Demo
                        </Button>
                    </div>
                </div>

                {/* Hero Image Area with Floating Cards */}
                <div className="relative h-[500px] md:h-[600px]">
                    {/* Central Person Placeholder */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-80 md:w-80 md:h-96">
                        <div className="relative w-full h-full">
                            {/* Person silhouette placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#2F92C7]/50 to-transparent rounded-3xl overflow-hidden">
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-64 md:w-56 md:h-72">
                                    {/* Stylized person shape */}
                                    <div className="w-full h-full bg-gradient-to-t from-[#3d7ea8] to-[#2F92C7] rounded-t-full opacity-80" />
                                    {/* Hair/head area */}
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-b from-[#4a3728] to-[#3d2e22] rounded-full" />
                                    {/* Glasses effect */}
                                    <div className="absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 flex gap-2">
                                        <div className="w-8 h-6 md:w-10 md:h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/40" />
                                        <div className="w-8 h-6 md:w-10 md:h-8 rounded-full bg-white/30 backdrop-blur-sm border border-white/40" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card - Left: Ideas */}
                    <div className="absolute left-4 md:left-52 top-24 md:top-32 animate-float animation-delay-200">
                        <div className="bg-white rounded-2xl shadow-xl p-4 w-48 md:w-56">
                            <div className="text-xs text-gray-500 mb-2">Idea Dump</div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F92C7] to-[#1F92F9] flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="white" strokeWidth="1.5" fill="none" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Quick</div>
                                    <div className="text-sm text-[#2F92C7] font-bold">Capture Ideas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                <span>12 new ideas</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5H7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card - Center: Series Progress */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-12 md:top-16 animate-float animation-delay-400">
                        <div className="bg-white rounded-2xl shadow-xl p-4 w-52 md:w-60">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-500" />
                                <div className="text-xs text-gray-500">Track your content<br />series progress</div>
                            </div>
                            <div className="text-xs text-gray-400 mb-1">Series: 21 Startup Terms</div>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-[#2F92C7] to-[#1F92F9] rounded-full" style={{ width: '65%' }} />
                                </div>
                                <span className="text-sm font-bold text-[#2F92C7]">65%</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card - Right: Template */}
                    <div className="absolute right-4 md:right-52 top-20 md:top-28 animate-float-reverse">
                        <div className="bg-white rounded-2xl shadow-xl p-4 w-44 md:w-52">
                            <div className="text-xs text-gray-500 mb-2">Templates</div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-amber-700">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">X Thread</div>
                                    <div className="text-xs text-gray-400">Hook + Story</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-500">Ready to use</div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Card - Far Right: Planning */}
                    <div className="hidden lg:block absolute right-4 md:right-80 top-56 animate-float animation-delay-600">
                        <div className="bg-white rounded-2xl shadow-xl p-3 w-40">
                            <div className="text-xs text-gray-500 mb-2">Planning</div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Content Status</div>
                                <div className="flex gap-1">
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Planned</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Refined</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-white/80 text-sm mb-2">Trusted by 2,100+ solo creators & indie founders</div>
                    <div className="flex justify-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FFD700">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom curve transition */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                    <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white" />
                </svg>
            </div>
        </section>
    );
};

export default LandingHero;
