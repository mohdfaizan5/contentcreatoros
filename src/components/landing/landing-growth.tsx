'use client';

import React from 'react';

const LandingGrowth = () => {
    const contentFlow = [
        { stage: 'Dumped', count: 24, color: '#9CA3AF' },
        { stage: 'Refined', count: 18, color: '#F59E0B' },
        { stage: 'Planned', count: 12, color: '#2F92C7' },
        { stage: 'Scripted', count: 8, color: '#22C55E' },
    ];

    return (
        <section className="relative bg-gradient-to-b from-white to-[#E8F4FA] py-20 md:py-32 overflow-hidden">
            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-6 text-center mb-16">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                    Watch your ideas <span className="font-light italic">transform</span>
                </h2>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                        <span className="text-green-500 font-bold">+67%</span>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2F92C7] to-[#1F92F9]" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-500 animate-pulse-glow" />
                </div>
                <p className="text-gray-500 text-lg">
                    Average increase in content output when creators think in systems.
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Side - Content Pipeline Card */}
                    <div className="space-y-6">
                        {/* Dark Card with Pipeline */}
                        <div className="bg-[#051031] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
                            {/* Decorative gradient */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-green-500/20 to-transparent rounded-full blur-2xl" />

                            <div className="relative z-10">
                                <h3 className="text-xl md:text-2xl font-bold mb-2">
                                    Move ideas through
                                    <br />
                                    your content pipeline
                                    <br />
                                    with a clear
                                    <br />
                                    <span className="text-[#2F92C7]">status system</span>
                                </h3>
                            </div>
                        </div>

                        {/* Status Flow Chart */}
                        <div className="bg-[#F7F7F7] rounded-3xl p-6 md:p-8">
                            <div className="flex items-center gap-6 mb-6">
                                <div className="text-sm text-gray-600 font-medium">Idea Pipeline</div>
                            </div>

                            {/* Status Bars */}
                            <div className="relative h-48">
                                <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-400">
                                    <span>24</span>
                                    <span>18</span>
                                    <span>12</span>
                                    <span>0</span>
                                </div>
                                <div className="ml-16 h-40 flex items-end justify-around gap-4">
                                    {contentFlow.map((item) => (
                                        <div key={item.stage} className="flex flex-col items-center gap-1">
                                            <div
                                                className="w-12 md:w-16 rounded-t-md transition-all duration-500"
                                                style={{
                                                    height: `${(item.count / 24) * 140}px`,
                                                    backgroundColor: item.color
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="ml-16 flex justify-around text-xs text-gray-400 mt-2">
                                    {contentFlow.map(item => (
                                        <span key={item.stage} className="text-center">{item.stage}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Series Progress Interface */}
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg">
                        <div className="mb-6">
                            <label className="text-sm text-gray-500 mb-2 block">Active Series</label>
                            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                <span className="text-xl font-semibold">21 Startup Terms to Know</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-sm text-gray-500 mb-2 block">Platform</label>
                                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">X</span>
                                    </div>
                                    <span className="text-xl font-semibold">X (Twitter)</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 mb-2 block">Total Pieces</label>
                                <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                    <span className="text-xl font-semibold">21</span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-sm text-gray-500 mb-2 block">Progress</label>
                            <div className="flex gap-2">
                                {['Planned', 'In Progress', 'Completed'].map((status, index) => (
                                    <button
                                        key={status}
                                        className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${index === 1
                                            ? 'bg-[#1F92F9] text-white'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                <span>Series Completion</span>
                                <span className="text-[#2F92C7] font-medium">14 of 21</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#2F92C7] to-[#1F92F9] rounded-full" style={{ width: '67%' }} />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                            <div className="text-sm text-gray-500 mb-1">Remaining</div>
                            <div className="text-4xl font-bold text-gray-900">7 posts</div>
                            <div className="text-sm text-gray-400 mt-1">to complete this series</div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button className="flex-1 bg-[#000100] text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-all">
                                View Series
                            </button>
                            <button className="flex items-center gap-2 bg-gray-100 py-3 px-6 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-all">
                                Add Content
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Series-first thinking helps you build compound content that grows your audience over time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Green Wave/Mountain Decoration */}
            <div className="mt-16 relative h-32 md:h-48 overflow-hidden">
                <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full">
                    <path
                        d="M0 200L48 180C96 160 192 120 288 100C384 80 480 80 576 90C672 100 768 120 864 130C960 140 1056 140 1152 130C1248 120 1344 100 1392 90L1440 80V200H1392C1344 200 1248 200 1152 200C1056 200 960 200 864 200C768 200 672 200 576 200C480 200 384 200 288 200C192 200 96 200 48 200H0Z"
                        fill="url(#greenGradient)"
                    />
                    <defs>
                        <linearGradient id="greenGradient" x1="720" y1="80" x2="720" y2="200" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4ADE80" />
                            <stop offset="1" stopColor="#22C55E" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Water reflection effect */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#2F92C7]/30 to-transparent" />
            </div>
        </section>
    );
};

export default LandingGrowth;
