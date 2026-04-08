'use client';

import { Lightbulb, FileText, Sparkle, Stack, LinkSimple, Magnet, ArrowRight, Lightning } from '@phosphor-icons/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const quickActions = [
    {
        title: 'Dump an Idea',
        description: 'Capture a raw thought before it escapes',
        href: '/app/ideas',
        icon: Lightbulb,
        gradient: 'from-amber-500 to-orange-600',
        bgGlow: 'bg-amber-500',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
        title: 'Create Template',
        description: 'Build a thinking scaffold for content',
        href: '/app/templates',
        icon: FileText,
        gradient: 'from-blue-500 to-indigo-600',
        bgGlow: 'bg-blue-500',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        title: 'Save Inspiration',
        description: 'Collect content that inspires you',
        href: '/app/inspiration',
        icon: Sparkle,
        gradient: 'from-purple-500 to-pink-600',
        bgGlow: 'bg-purple-500',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
        title: 'Start a Series',
        description: 'Think in systems, not random posts',
        href: '/app/series',
        icon: Stack,
        gradient: 'from-green-500 to-emerald-600',
        bgGlow: 'bg-green-500',
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-600 dark:text-green-400',
    },
    {
        title: 'Public Profile',
        description: 'Create your public profile page',
        href: '/app/public-profile',
        icon: LinkSimple,
        gradient: 'from-sky-500 to-blue-600',
        bgGlow: 'bg-sky-500',
        iconBg: 'bg-sky-500/10',
        iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
        title: 'Lead Magnet',
        description: 'Grow your email list',
        href: '/app/lead-magnets',
        icon: Magnet,
        gradient: 'from-rose-500 to-red-600',
        bgGlow: 'bg-rose-500',
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-400',
    },
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const [greeting, setGreeting] = useState('Welcome');

    useEffect(() => {
        setGreeting(getGreeting());
    }, []);

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Welcome Section */}
            <div className="animate-fade-in-up">
                {/* <div className="flex items-center gap-2 mb-2">
                    <Lightning weight="fill" className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-muted-foreground">{greeting}</span>
                </div> */}
                <h1 className="text-4xl font-bold tracking-tight text-gradient-cool">
                    Content OS
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Your daily system for capturing ideas and creating consistent content.
                </p>
            </div>

    

           
        </div>
    );
}
