'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Stack } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createIdea } from '@/actions/ideas';
import type { IdeaType } from '@/types/database';

export function IdeaDump() {
    const [title, setTitle] = useState('');
    const [rawText, setRawText] = useState('');
    const [isSeriesConcept, setIsSeriesConcept] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!title.trim()) return;

        startTransition(async () => {
            try {
                await createIdea({
                    title: title.trim(),
                    raw_text: rawText.trim() || null,
                    idea_type: isSeriesConcept ? 'series_concept' : 'standalone',
                    status: 'dumped',
                });
                setTitle('');
                setRawText('');
                setIsSeriesConcept(false);
            } catch (error) {
                console.error('Failed to create idea:', error);
            }
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" weight="duotone" />
                <h2 className="font-semibold">Dump an Idea</h2>
            </div>

            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="What's the idea? (title)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <textarea
                    placeholder="Expand on it... (optional)"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </div>

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsSeriesConcept(!isSeriesConcept)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${isSeriesConcept
                            ? 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400'
                            : 'hover:bg-muted'
                        }`}
                >
                    <Stack className="h-4 w-4" weight={isSeriesConcept ? 'fill' : 'regular'} />
                    <span className="text-sm font-medium">This is a Series Concept</span>
                </button>

                <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || isPending}
                >
                    {isPending ? 'Saving...' : 'Dump It'}
                </Button>
            </div>
        </div>
    );
}
