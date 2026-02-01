'use client';

import { useState, useTransition } from 'react';
import { Lightbulb, Stack, PaperPlaneTilt } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { createIdea } from '@/actions/ideas';
import type { IdeaType } from '@/types/database';

export function IdeaDump() {
    const [title, setTitle] = useState('');
    const [rawText, setRawText] = useState('');
    const [isSeriesConcept, setIsSeriesConcept] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isFocused, setIsFocused] = useState(false);

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
        <div className={`relative rounded-2xl border bg-card p-6 space-y-4 transition-all duration-300 ${isFocused ? 'border-primary/50 shadow-lg' : ''}`}>
            {/* Decorative glow */}
            <div className={`absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />

            <div className="relative flex items-center gap-2">
                <div className="icon-container h-10 w-10 rounded-lg bg-amber-500/10">
                    <Lightbulb className="h-5 w-5 text-amber-500" weight="duotone" />
                </div>
                <div>
                    <h2 className="font-semibold">Dump an Idea</h2>
                    <p className="text-xs text-muted-foreground">No structure required</p>
                </div>
            </div>

            <div className="relative space-y-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="What's the idea?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-lg font-medium"
                    />
                </div>

                <AutoResizeTextarea
                    placeholder="Expand on it... (optional)"
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    minRows={2}
                    maxRows={8}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                />
            </div>

            <div className="relative flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setIsSeriesConcept(!isSeriesConcept)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 ${isSeriesConcept
                        ? 'bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400 shadow-sm glow-green'
                        : 'hover:bg-muted hover:border-muted-foreground/20'
                        }`}
                >
                    <Stack
                        className={`h-5 w-5 transition-transform duration-300 ${isSeriesConcept ? 'scale-110' : ''}`}
                        weight={isSeriesConcept ? 'fill' : 'regular'}
                    />
                    <span className="text-sm font-medium">Series Concept</span>
                </button>

                <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || isPending}
                    className="gap-2 rounded-xl px-6 transition-all duration-200 hover:scale-105"
                >
                    <PaperPlaneTilt className="h-4 w-4" weight="fill" />
                    {isPending ? 'Saving...' : 'Dump It'}
                </Button>
            </div>
        </div>
    );
}
