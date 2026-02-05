'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from 'next/link';

const LandingCryptoEntry = () => {
    return (
        <section className="relative bg-white py-20 md:py-32 overflow-hidden">
            {/* Decorative floating elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -bg-amber-300">
                {/* Left decoratives */}
                <div className="absolute top-32 left-8 w-8 h-8 border-2 border-gray-200 rounded-lg rotate-12 animate-float-slow" />
                <div className="absolute top-48 left-24 w-6 h-6 bg-gray-100 rounded-full animate-float animation-delay-200" />
                <div className="absolute top-1/2 left-12">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" className="animate-pulse-glow">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </div>

                {/* Right decoratives */}
                <div className="absolute top-40 right-16 w-10 h-10 border-2 border-[#2F92C7]/30 rounded-lg -rotate-12 animate-float-reverse" />
                <div className="absolute top-1/3 right-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#2F92C7]/20 to-[#1F92F9]/20 rounded-xl animate-float animation-delay-400" />
                </div>
                <div className="absolute bottom-40 right-24 w-6 h-6 bg-[#2F92C7]/10 rounded-full animate-float-slow" />

                {/* Bottom left */}
                <div className="absolute bottom-32 left-20">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" className="animate-float animation-delay-600">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                </div>

                {/* 3D sphere effects */}
                <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-[#2F92C7]/20 to-transparent blur-sm animate-float-slow" />
                <div className="absolute bottom-1/4 left-1/3 w-12 h-12 rounded-full bg-gradient-to-br from-green-400/20 to-transparent blur-sm animate-float animation-delay-1000" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                {/* Section Title */}
                <div className="text-center mb-16">
                    <h2 className="font-sans text-3xl md:text-4xl lg:text-6xl font-medium text-gray-900 leading-12 mb-6">
                        From
                        <span className="px-1">
                            <Avatar className=' w-8 h-8 md:w-10 md:h-10 inline-block '>
                                <AvatarImage className='rounded-2xl after:rounded-2xl' src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </span>
                        raw thought to
                        <br />
                        structured <span className="inline-flex items-center gap-1">
                            <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#2F92C7] to-[#1F92F9]" />
                            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-green-400 to-green-500" />
                        </span> idea to
                        <br />
                        <span className="text-gradient-blue">repeatable output</span>
                    </h2>
                    <p className="text-gray-500 text-lg leading-5 max-w-2xl mx-auto mb-8">
                        Content OS doesn&apos;t require special knowledge. It&apos;s designed for
                        <br className="hidden md:block" />
                        solo creators who want to stay consistent without the chaos.
                    </p>

                    <Link href="/auth/sign-up">
                        <Button
                            className="bg-[#000100] text-white hover:bg-gray-800 rounded-full px-6 py-3 font-medium inline-flex items-center gap-2"
                        >
                            Start dumping ideas
                            <span className="w-6 h-6 bg-[#1F92F9] rounded-md flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </Button>
                    </Link>
                </div>

                {/* Phone Mockup */}
                <div className="flex justify-center">
                    <div className="relative">
                        {/* Phone Frame */}
                        <div className="w-64 md:w-72 bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                            <div className="bg-white rounded-[32px] overflow-hidden">
                                {/* Phone Screen Content */}
                                <div className="bg-gradient-to-b from-[#2F92C7] to-[#1F92F9] p-6 pt-8">
                                    {/* Status bar placeholder */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-20 h-6 bg-black/20 rounded-full" />
                                    </div>

                                    {/* App Header */}
                                    <div className="flex items-center justify-center gap-2 text-white mb-6">
                                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                            </svg>
                                        </div>
                                        <span className="font-bold">Content OS</span>
                                    </div>

                                    {/* User Avatar */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border-4 border-white/30 overflow-hidden">
                                            {/* Avatar placeholder - person silhouette */}
                                            <div className="w-full h-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-end justify-center">
                                                <div className="w-16 h-16 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Info */}
                                <div className="p-6 bg-white">
                                    <div className="text-center mb-4">
                                        <div className="font-semibold text-gray-900">Creator Dashboard</div>
                                        <div className="text-xs text-gray-400">Your content command center</div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                                        <div className="text-xs text-gray-400 mb-1">Ideas This Week</div>
                                        <div className="text-3xl font-bold text-gray-900">24<span className="text-lg text-gray-400 font-normal"> ideas</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="bg-[#2F92C7] text-white py-3 rounded-xl text-sm font-medium">
                                            Dump Idea
                                        </button>
                                        <button className="bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-medium border border-gray-200">
                                            View Series
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative elements around phone */}
                        <div className="absolute -top-8 -right-12 w-16 h-16 bg-gradient-to-br from-[#2F92C7]/20 to-transparent rounded-full blur-md animate-pulse-glow" />
                        <div className="absolute -bottom-8 -left-12 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-md animate-pulse-glow animation-delay-1000" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingCryptoEntry;
