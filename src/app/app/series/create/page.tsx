'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Stack, SpinnerGap, TwitterLogo, YoutubeLogo, LinkedinLogo, Article } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { createSeries } from '@/actions/series';

const platforms = [
    { value: 'x', icon: TwitterLogo, label: 'X', color: 'hover:bg-sky-500/10 hover:text-sky-500 data-[active=true]:bg-sky-500/10 data-[active=true]:text-sky-500 data-[active=true]:border-sky-500/30' },
    { value: 'linkedin', icon: LinkedinLogo, label: 'LinkedIn', color: 'hover:bg-blue-600/10 hover:text-blue-600 data-[active=true]:bg-blue-600/10 data-[active=true]:text-blue-600 data-[active=true]:border-blue-600/30' },
    { value: 'youtube', icon: YoutubeLogo, label: 'YouTube', color: 'hover:bg-red-500/10 hover:text-red-500 data-[active=true]:bg-red-500/10 data-[active=true]:text-red-500 data-[active=true]:border-red-500/30' },
    { value: '', icon: Article, label: 'Multi-platform', color: 'hover:bg-gray-500/10 hover:text-gray-500 data-[active=true]:bg-gray-500/10 data-[active=true]:text-gray-500 data-[active=true]:border-gray-500/30' },
];

export default function CreateSeriesPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [platform, setPlatform] = useState('');
    const [totalItems, setTotalItems] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                await createSeries({
                    name: name.trim(),
                    description: description.trim() || null,
                    target_platform: platform || null,
                    total_planned_items: parseInt(totalItems) || 0,
                });
                router.push('/app/series');
            } catch (error) {
                console.error('Failed to create series:', error);
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <Link
                href="/app/series"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Series
            </Link>

            {/* Series name - primary input */}
            <input
                type="text"
                placeholder="Series name (e.g., 21 Startup Terms)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg font-medium transition-all"
            />

            {/* Platform selector - horizontal pills */}
            <div className="flex items-center gap-2 flex-wrap">
                {platforms.map((p) => {
                    const Icon = p.icon;
                    const isActive = platform === p.value;
                    return (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setPlatform(p.value)}
                            data-active={isActive}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${p.color}`}
                        >
                            <Icon className="h-4 w-4" weight={isActive ? 'fill' : 'regular'} />
                            <span>{p.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Optional fields */}
            <div className="space-y-4">
                <AutoResizeTextarea
                    placeholder="Description (optional) — What's this series about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minRows={2}
                    maxRows={6}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />

                <input
                    type="number"
                    placeholder="Planned items count (optional, e.g., 21)"
                    value={totalItems}
                    onChange={(e) => setTotalItems(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !name.trim()}
                    className="gap-2 px-6"
                >
                    {isPending ? (
                        <>
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Series'
                    )}
                </Button>
            </div>
        </div>
    );
}
