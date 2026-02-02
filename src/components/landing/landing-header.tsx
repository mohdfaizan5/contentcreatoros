'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';

const LandingHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <nav className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                {/* Logo */}
                <Logo full textClassName="text-white font-bold" />

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-1">
                    <button className="px-4 py-2 rounded-full bg-[#000100] text-white text-sm font-medium transition-all hover:bg-gray-800">
                        Features
                    </button>
                    <button className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all hover:bg-white/20">
                        Templates
                    </button>
                    <button className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all hover:bg-white/20">
                        Series
                    </button>
                    <button className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all hover:bg-white/20">
                        Pricing
                    </button>
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link href="/auth/login" className="text-white font-medium hover:underline">
                        Log In
                    </Link>
                    <Link href="/auth/sign-up">
                        <Button
                            className="bg-white text-[#000100] hover:bg-gray-100 rounded-full px-6 py-2 font-medium flex items-center gap-2"
                        >
                            Start Creating
                            <span className="w-5 h-5 bg-[#000100] rounded-full flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-white p-2"
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

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#2F92C7]/95 backdrop-blur-md p-4 border-t border-white/20">
                    <div className="flex flex-col gap-2">
                        <button className="px-4 py-3 rounded-lg bg-[#000100] text-white text-sm font-medium">
                            Features
                        </button>
                        <button className="px-4 py-3 rounded-lg text-white text-sm font-medium hover:bg-white/10">
                            Templates
                        </button>
                        <button className="px-4 py-3 rounded-lg text-white text-sm font-medium hover:bg-white/10">
                            Series
                        </button>
                        <button className="px-4 py-3 rounded-lg text-white text-sm font-medium hover:bg-white/10">
                            Pricing
                        </button>
                        <hr className="border-white/20 my-2" />
                        <Link href="/auth/login" className="px-4 py-3 rounded-lg text-white text-sm font-medium hover:bg-white/10 text-center">
                            Log In
                        </Link>
                        <Link href="/auth/sign-up">
                            <Button className="w-full bg-white text-[#000100] hover:bg-gray-100 rounded-lg py-3 font-medium">
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
