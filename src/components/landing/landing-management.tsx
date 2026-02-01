'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';

const LandingManagement = () => {
    const platforms = [
        { name: 'X', color: 'from-gray-700 to-gray-900', letter: '𝕏' },
        { name: 'YouTube', color: 'from-red-500 to-red-600', letter: '▶' },
        { name: 'LinkedIn', color: 'from-blue-500 to-blue-700', letter: 'in' },
        { name: 'TikTok', color: 'from-pink-500 to-purple-600', letter: '♪' },
        { name: 'Instagram', color: 'from-purple-500 to-pink-500', letter: '📷' },
        { name: 'Newsletter', color: 'from-green-400 to-green-600', letter: '✉' },
        { name: 'Threads', color: 'from-gray-600 to-gray-800', letter: '@' },
        { name: 'Blog', color: 'from-blue-400 to-blue-600', letter: '✎' },
        { name: 'X', color: 'from-gray-700 to-gray-900', letter: '𝕏' },
        { name: 'YouTube', color: 'from-red-500 to-red-600', letter: '▶' },
    ];

    return (
        <section className="relative bg-[#E8F4FA]2 py-20 md:py-32  overflow-hidden">
            {/* Decorative icon */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-gray-400 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
                Platform Templates
            </div>

            <div className="max-w-7xl mx-auto px-6">
                {/* Section Title */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl lg:text-5xl font-medium from-[#2F92C7] to-[#3c5f6f] bg-gradient-to-br  inline-block text-transparent bg-clip-text leading-[2.8rem]">
                        Templates act as
                        <br />
                        <span className="text-[#50B0FF] bg-[#DAE7F4]/80 px-1">thinking scaffolds</span>
                        <br />
                        not content generators.
                    </h2>
                </div>

                {/* Two Column Cards */}
                <div className="grid lg:grid-cols-2 gap-8 ">
                    {/* Left Card - Dark with platform icons */}
                    <div className="bg-[#051031] rounded-3xl p-8 text-white relative overflow-hidden flex flex- justify-center items-center ">
                        {/* Decorative elements */}


                        <div className="pt-16 flex flex-col items-center">
                            <Badge className="justify-center flex items-center gap-2 text-white/60 text-sm">
                                Multi-Platform
                            </Badge>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                                Create once, <span className="font-light italic">adapt</span>
                                <br />
                                for any platform <span className="text-white/80">with</span>
                                <br />
                                <span className="text-white/80">templates built for</span>
                                <br />
                                <span className="text-white/80">X, YouTube, LinkedIn & more.</span>
                            </h3>

                            <Button className="bg-[#2F92C7] mx-auto text-white hover:bg-[#258ab8] rounded-full px-8 py-6 mt-6 inline-flex items-center gap-2">
                                Explore Templates
                                <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </Button>
                            {/* Platform Icons Row */}
                            <div className="flex items-center justify-center absolute left-0 -space-x-2.5 mt-8 pt-8 border-t border-white/10">
                                {platforms.map((platform, index) => (
                                    <div
                                        key={`${platform.name}-${index}`}
                                        className={`w-[4.2rem] h-[4.2rem] rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                                    >
                                        {platform.letter}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Card - Light with template preview */}
                    <div className="bg-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#2F92C7] rounded-lg flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                                    </svg>
                                </div>
                                <span className="font-semibold text-gray-900">Content OS</span>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Templates</span>
                        </div>

                        {/* Template Preview Inside */}
                        <div className="bg-gradient-to-br from-[#2F92C7] to-[#1F92F9] rounded-2xl p-6 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl" />

                            <div className="relative z-10">
                                <div className="text-white/70 text-xs mb-2">X Thread Template</div>
                                <div className="text-white font-semibold mb-3">Hook + Story + CTA</div>
                                <div className="space-y-2">
                                    <div className="bg-white/20 rounded-lg p-2 text-white/90 text-xs">
                                        🧵 Hook: Start with a bold claim...
                                    </div>
                                    <div className="bg-white/20 rounded-lg p-2 text-white/90 text-xs">
                                        📖 Story: Share your experience...
                                    </div>
                                    <div className="bg-white/20 rounded-lg p-2 text-white/90 text-xs">
                                        💡 CTA: End with actionable advice...
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Template Types Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-xs text-gray-400 mb-1">Platform</div>
                                <div className="text-lg font-bold text-gray-900">X (Twitter)</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="text-xs text-gray-400 mb-1">Type</div>
                                <div className="text-lg font-bold text-[#2F92C7]">Thread</div>
                            </div>
                        </div>

                        {/* Template Features */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-medium text-gray-700">Template Features</div>
                                <div className="text-xs text-gray-400">Customizable</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200">Hook Style</span>
                                <span className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200">Length</span>
                                <span className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200">Tone</span>
                                <span className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200">CTA Style</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingManagement;
