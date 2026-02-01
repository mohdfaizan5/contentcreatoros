'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const LandingExpansion = () => {
    return (
        <section className="relative bg-gradient-to-b from-[#0a1628] via-[#051031] to-[#000308] py-20 md:py-32 overflow-hidden">
            {/* Stars/Space Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Stars */}
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.7 + 0.3,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${Math.random() * 2 + 1}s`,
                        }}
                    />
                ))}

                {/* Glowing orbs */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2F92C7]/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-[#1F92F9]/30 rounded-full blur-2xl animate-pulse-glow" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Section Title */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                        <span className="font-light italic">Stop posting</span>
                        <br />
                        random content.
                        <br />
                        Start thinking in
                        <br />
                        <span className="text-gradient-blue">series</span>
                    </h2>
                </div>

                {/* Globe/Person Visual */}
                <div className="flex justify-center mb-16">
                    <div className="relative w-64 h-80 md:w-80 md:h-96">
                        {/* Globe effect */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#2F92C7]/30 to-transparent blur-xl animate-pulse-glow" />

                        {/* Person placeholder - looking up at sky */}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 md:w-56">
                            {/* Silhouette */}
                            <div className="relative">
                                {/* Head */}
                                <div className="w-24 h-24 md:w-28 md:h-28 mx-auto rounded-full bg-gradient-to-b from-[#4a3728] to-[#3d2e22] relative overflow-hidden">
                                    {/* Hair details */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#5a4738]/80 to-transparent rounded-full" />
                                </div>
                                {/* Shoulders */}
                                <div className="w-32 h-20 md:w-40 md:h-24 mx-auto bg-gradient-to-b from-[#1a1a2e] to-[#0a0a1a] rounded-t-full -mt-4" />
                            </div>
                        </div>

                        {/* Reflection/glow effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#2F92C7]/20 to-transparent" />
                    </div>
                </div>

                {/* Bottom Content */}
                <div className="text-center max-w-2xl mx-auto">
                    <p className="text-white/70 text-lg mb-8">
                        Random content doesn&apos;t compound. Series do.
                        <br />
                        Content OS helps you plan, track, and complete
                        <br />
                        content series that build your audience over time.
                    </p>

                    <Link href="/auth/sign-up">
                        <Button
                            className="bg-[#2F92C7] text-white hover:bg-[#258ab8] rounded-full px-8 py-4 font-medium inline-flex items-center gap-2 shadow-lg shadow-[#2F92C7]/30"
                        >
                            Start Your First Series
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                            </svg>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent" />
        </section>
    );
};

export default LandingExpansion;
