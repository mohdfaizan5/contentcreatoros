'use client';

import Link from 'next/link';
import { Plus, FileText, TwitterLogo, YoutubeLogo, LinkedinLogo, Article } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { TemplatesMasonryGrid } from './templates-bento-grid';
import type { Template } from '@/types/database';

interface TemplatesClientProps {
    templates: Template[];
}

export function TemplatesClient({ templates }: TemplatesClientProps) {
    // Count by platform
    const xCount = templates.filter(t => t.platform_type === 'x').length;
    const linkedinCount = templates.filter(t => t.platform_type === 'linkedin').length;
    const youtubeCount = templates.filter(t => t.platform_type === 'youtube').length;
    const genericCount = templates.filter(t => t.platform_type === 'generic').length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                        <p className="text-muted-foreground text-sm">
                            Content frameworks to structure your thinking
                        </p>
                    </div>
                </div>
                <Link href="/app/templates/create">
                    <Button className="gap-2 rounded-xl transition-all duration-200 hover:scale-105">
                        <Plus className="h-4 w-4" weight="bold" />
                        New Template
                    </Button>
                </Link>
            </div>

            {/* Platform filter pills */}
            {templates.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
                        <span className="text-muted-foreground">All</span>
                        <span className="font-semibold">{templates.length}</span>
                    </div>
                    {xCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 text-sm text-sky-600">
                            <TwitterLogo className="h-4 w-4" weight="fill" />
                            <span className="font-medium">{xCount}</span>
                        </div>
                    )}
                    {linkedinCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/10 text-sm text-blue-600">
                            <LinkedinLogo className="h-4 w-4" weight="fill" />
                            <span className="font-medium">{linkedinCount}</span>
                        </div>
                    )}
                    {youtubeCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-sm text-red-500">
                            <YoutubeLogo className="h-4 w-4" weight="fill" />
                            <span className="font-medium">{youtubeCount}</span>
                        </div>
                    )}
                    {genericCount > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-500/10 text-sm text-gray-500">
                            <Article className="h-4 w-4" weight="fill" />
                            <span className="font-medium">{genericCount}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Masonry Grid */}
            <TemplatesMasonryGrid templates={templates} />
        </div>
    );
}
