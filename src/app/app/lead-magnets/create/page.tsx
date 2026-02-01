'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Magnet, SpinnerGap, Download, ArrowSquareOut, Article } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { createMagnet } from '@/actions/lead-magnets';
import type { DeliveryType } from '@/types/database';

const deliveryTypes: { value: DeliveryType; icon: React.ElementType; label: string; description: string }[] = [
    { value: 'download', icon: Download, label: 'Download', description: 'Send a file link' },
    { value: 'redirect', icon: ArrowSquareOut, label: 'Redirect', description: 'Redirect to URL' },
    { value: 'content', icon: Article, label: 'Content', description: 'Show inline content' },
];

export default function CreateLeadMagnetPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('download');
    const [deliveryUrl, setDeliveryUrl] = useState('');
    const [deliveryContent, setDeliveryContent] = useState('');

    // Auto-generate slug from title
    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')) {
            setSlug(value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !slug.trim()) return;

        startTransition(async () => {
            try {
                await createMagnet({
                    title: title.trim(),
                    slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    description: description.trim() || null,
                    delivery_type: deliveryType,
                    delivery_url: deliveryUrl.trim() || null,
                    delivery_content: deliveryContent.trim() || null,
                });
                router.push('/app/lead-magnets');
            } catch (error) {
                console.error('Failed to create lead magnet:', error);
            }
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <Link
                href="/app/lead-magnets"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Lead Magnets
            </Link>

            {/* Title - primary input */}
            <input
                type="text"
                placeholder="Lead magnet title (e.g., Free Startup Glossary)"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-4 rounded-2xl border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-lg font-medium transition-all"
            />

            {/* URL Slug */}
            <div className="space-y-1">
                <label className="text-sm text-muted-foreground">URL slug</label>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-sm">/m/</span>
                    <input
                        type="text"
                        placeholder="startup-glossary"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="flex-1 px-4 py-3 rounded-xl border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                </div>
            </div>

            {/* Delivery type - horizontal pills */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Type</label>
                <div className="flex items-center gap-2 flex-wrap">
                    {deliveryTypes.map((t) => {
                        const Icon = t.icon;
                        const isActive = deliveryType === t.value;
                        return (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setDeliveryType(t.value)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${isActive
                                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                        : 'hover:bg-muted'
                                    }`}
                            >
                                <Icon className="h-4 w-4" weight={isActive ? 'fill' : 'regular'} />
                                <span>{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Optional fields */}
            <div className="space-y-4">
                <AutoResizeTextarea
                    placeholder="Description (shown on landing page)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    minRows={2}
                    maxRows={6}
                    className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />

                {(deliveryType === 'download' || deliveryType === 'redirect') && (
                    <input
                        type="url"
                        placeholder={deliveryType === 'download' ? 'Download URL (file link)' : 'Redirect URL'}
                        value={deliveryUrl}
                        onChange={(e) => setDeliveryUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                )}

                {deliveryType === 'content' && (
                    <AutoResizeTextarea
                        placeholder="Content to show after submission..."
                        value={deliveryContent}
                        onChange={(e) => setDeliveryContent(e.target.value)}
                        minRows={4}
                        maxRows={12}
                        className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                )}
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !title.trim() || !slug.trim()}
                    className="gap-2 px-6"
                >
                    {isPending ? (
                        <>
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Lead Magnet'
                    )}
                </Button>
            </div>
        </div>
    );
}
