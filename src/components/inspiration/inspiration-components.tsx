'use client';

import { useState, useTransition } from 'react';
import { Sparkle, Trash, Link as LinkIcon, User } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createInspiration, deleteInspiration } from '@/actions/inspiration';
import type { Inspiration, InspirationType } from '@/types/database';

interface InspirationFormProps {
    onClose?: () => void;
}

export function InspirationForm({ onClose }: InspirationFormProps) {
    const [url, setUrl] = useState('');
    const [type, setType] = useState<InspirationType>('content');
    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [whatWorked, setWhatWorked] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!url.trim()) return;

        startTransition(async () => {
            try {
                await createInspiration({
                    url: url.trim(),
                    type,
                    title: title.trim() || null,
                    notes: notes.trim() || null,
                    what_worked: whatWorked.trim() || null,
                });
                setUrl('');
                setType('content');
                setTitle('');
                setNotes('');
                setWhatWorked('');
                onClose?.();
            } catch (error) {
                console.error('Failed to save inspiration:', error);
            }
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Sparkle className="h-5 w-5 text-purple-500" weight="duotone" />
                <h2 className="font-semibold">Add Inspiration</h2>
            </div>

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setType('content')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'content' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                >
                    <LinkIcon className="h-4 w-4" />
                    Content Link
                </button>
                <button
                    type="button"
                    onClick={() => setType('creator')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'creator' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                        }`}
                >
                    <User className="h-4 w-4" />
                    Creator Profile
                </button>
            </div>

            <input
                type="url"
                placeholder="Paste URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <textarea
                placeholder="Why was it good? (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <textarea
                placeholder="What worked? (hook, framing, angle...)"
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <Button onClick={handleSubmit} disabled={!url.trim() || isPending} className="w-full">
                {isPending ? 'Saving...' : 'Save Inspiration'}
            </Button>
        </div>
    );
}

interface InspirationCardProps {
    inspiration: Inspiration;
}

export function InspirationCard({ inspiration }: InspirationCardProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm('Delete this inspiration?')) return;
        startTransition(async () => {
            await deleteInspiration(inspiration.id);
        });
    };

    return (
        <div className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        {inspiration.type === 'creator' ? (
                            <User className="h-4 w-4 text-purple-500" weight="fill" />
                        ) : (
                            <LinkIcon className="h-4 w-4 text-purple-500" weight="duotone" />
                        )}
                        <a
                            href={inspiration.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-primary truncate"
                        >
                            {inspiration.title || inspiration.url}
                        </a>
                    </div>

                    {inspiration.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{inspiration.notes}</p>
                    )}

                    {inspiration.what_worked && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ {inspiration.what_worked}
                        </p>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface InspirationListProps {
    inspirations: Inspiration[];
}

export function InspirationList({ inspirations }: InspirationListProps) {
    if (inspirations.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <Sparkle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No inspiration saved</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Start collecting content that inspires you
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {inspirations.map((insp) => (
                <InspirationCard key={insp.id} inspiration={insp} />
            ))}
        </div>
    );
}
