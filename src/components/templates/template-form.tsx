'use client';

import { useState, useTransition } from 'react';
import { FileText, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createTemplate } from '@/actions/templates';
import type { PlatformType } from '@/types/database';

const platforms: { value: PlatformType; label: string }[] = [
    { value: 'x', label: 'X (Twitter)' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'generic', label: 'Generic' },
];

interface TemplateFormProps {
    onClose?: () => void;
}

export function TemplateForm({ onClose }: TemplateFormProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState<PlatformType>('generic');
    const [hookStyle, setHookStyle] = useState('');
    const [length, setLength] = useState('');
    const [tone, setTone] = useState('');
    const [ctaStyle, setCtaStyle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!name.trim()) return;

        startTransition(async () => {
            try {
                await createTemplate({
                    name: name.trim(),
                    platform_type: platform,
                    hook_style: hookStyle.trim() || null,
                    length: length.trim() || null,
                    tone: tone.trim() || null,
                    cta_style: ctaStyle.trim() || null,
                    instructions: instructions.trim() || null,
                });
                onClose?.();
            } catch (error) {
                console.error('Failed to create template:', error);
            }
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" weight="duotone" />
                    <h2 className="font-semibold">Create Template</h2>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon-sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Viral Tweet Thread"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Platform</label>
                        <div className="grid grid-cols-2 gap-2">
                            {platforms.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPlatform(p.value)}
                                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${platform === p.value
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'hover:bg-muted'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={() => setStep(2)}
                        disabled={!name.trim()}
                    >
                        Continue
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Answer these questions to create your thinking scaffold.
                    </p>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Hook Style</label>
                        <input
                            type="text"
                            placeholder="e.g., Question, Bold statement, Story opener"
                            value={hookStyle}
                            onChange={(e) => setHookStyle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Length</label>
                        <input
                            type="text"
                            placeholder="e.g., Short (280 chars), Medium (5-7 tweets), Long"
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Tone</label>
                        <input
                            type="text"
                            placeholder="e.g., Professional, Casual, Educational, Provocative"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">CTA Style</label>
                        <input
                            type="text"
                            placeholder="e.g., Follow for more, Retweet if you agree, Link in bio"
                            value={ctaStyle}
                            onChange={(e) => setCtaStyle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Additional Instructions (optional)</label>
                        <textarea
                            placeholder="Any other notes for using this template..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            Back
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={isPending}
                        >
                            {isPending ? 'Creating...' : 'Create Template'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
