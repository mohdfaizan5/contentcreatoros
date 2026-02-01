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
        title: 'Setup Links',
        description: 'Create your public profile page',
        href: '/app/links',
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
                <div className="flex items-center gap-2 mb-2">
                    <Lightning weight="fill" className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-medium text-muted-foreground">{greeting}</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gradient-cool">
                    Content OS
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                    Your daily system for capturing ideas and creating consistent content.
                </p>
            </div>

            {/* Quick Actions */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Quick Actions</h2>
                    <span className="text-xs text-muted-foreground">Choose where to start</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
                    {quickActions.map((action) => (
                        <Link
                            key={action.title}
                            href={action.href}
                            className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 card-hover-lift card-shine hover:border-primary/30"
                        >
                            {/* Glow effect on hover */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 ${action.bgGlow} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 rounded-full`} />

                            {/* Icon */}
                            <div className={`icon-container inline-flex h-12 w-12 items-center justify-center rounded-xl ${action.iconBg} mb-4`}>
                                <action.icon className={`h-6 w-6 ${action.iconColor}`} weight="duotone" />
                            </div>

                            {/* Content */}
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                                {action.title}
                                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1.5">
                                {action.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Philosophy Section */}
            <div className="relative overflow-hidden rounded-2xl border-gradient p-px">
                <div className="rounded-2xl bg-card p-6 relative">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-primary/5 to-purple-500/5 rounded-full blur-3xl" />

                    <div className="relative">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkle weight="fill" className="h-5 w-5 text-purple-500" />
                            <h2 className="text-lg font-semibold">Philosophy</h2>
                        </div>
                        <blockquote className="border-l-2 border-primary/50 pl-4 py-1">
                            <p className="text-muted-foreground leading-relaxed">
                                Content should move from{' '}
                                <span className="text-foreground font-medium">raw thought</span> →{' '}
                                <span className="text-foreground font-medium">structured idea</span> →{' '}
                                <span className="text-foreground font-medium">repeatable output</span>.
                            </p>
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Quick Stats Placeholder */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card/50 p-4 transition-all hover:bg-card">
                    <div className="text-2xl font-bold text-gradient-warm">—</div>
                    <p className="text-sm text-muted-foreground mt-1">Ideas captured</p>
                </div>
                <div className="rounded-xl border bg-card/50 p-4 transition-all hover:bg-card">
                    <div className="text-2xl font-bold text-gradient-cool">—</div>
                    <p className="text-sm text-muted-foreground mt-1">Series in progress</p>
                </div>
                <div className="rounded-xl border bg-card/50 p-4 transition-all hover:bg-card">
                    <div className="text-2xl font-bold text-gradient-primary">—</div>
                    <p className="text-sm text-muted-foreground mt-1">Templates created</p>
                </div>
            </div>
        </div>
    );
}
