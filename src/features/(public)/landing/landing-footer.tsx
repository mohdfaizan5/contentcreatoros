'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/shared/components/logo';

type LandingFooterProps = {
    isAuthenticated?: boolean;
};

const LandingFooter = ({ isAuthenticated = false }: LandingFooterProps) => {
    const footerCtaHref = isAuthenticated ? '/app' : '/sign-up';

    return (
        <footer className="bg-[#000308] text-white py-16">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Logo & Description */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Logo full textClassName="font-bold" />
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            A daily-use system for creators to capture ideas, plan content, and think in series. Designed for solo creators and small teams.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <div className="space-y-2 text-white/60 text-sm flex flex-col">
                            <Link href={"#"} className="hover:text-white transition-colors">Ideas</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Templates</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Series</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Planning</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Lead Magnets</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <div className="space-y-2 text-white/60 text-sm flex flex-col">
                            <Link href={"#"} className="hover:text-white transition-colors">Getting Started</Link>
                            <Link href={"/templates"} className="hover:text-white transition-colors">Template Gallery</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Creator Stories</Link>
                            <Link href={"/pricing"} className="hover:text-white transition-colors">Pricing</Link>
                            <Link href={"/blog"} className="hover:text-white transition-colors">Blog</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <div className="space-y-2 text-white/60 text-sm flex flex-col">
                            <Link href={"#"} className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Terms of Service</Link>
                            <Link href={"#"} className="hover:text-white transition-colors">Cookie Policy</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-white/40 text-sm">
                        © 2024 Content OS. All rights reserved.
                    </p>

                    {/* Social Links */}
                    <div className="flex items-center gap-4">
                        <Link href={"#"} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                            </svg>
                        </Link>
                        <Link href={"#"} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                <rect x="2" y="9" width="4" height="12" />
                                <circle cx="4" cy="4" r="2" />
                            </svg>
                        </Link>
                        <Link href={"#"} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#000308" />
                            </svg>
                        </Link>
                        <Link href={footerCtaHref} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LandingFooter;
