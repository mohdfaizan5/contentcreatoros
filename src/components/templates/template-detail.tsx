'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash, PencilSimple, Copy, Check, SpinnerGap, TwitterLogo, YoutubeLogo, LinkedinLogo, Article } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { deleteTemplate, updateTemplate } from '@/actions/templates';
import { PlatformPreview } from './platform-preview';
import { PlaceholderList } from './placeholder-renderer';
import { ExamplesList } from './example-card';
import type { Template, PlatformType } from '@/types/database';

const platformConfig: Record<PlatformType, { icon: React.ElementType; color: string; label: string }> = {
    x: { icon: TwitterLogo, color: 'bg-sky-500/10 text-sky-600 border-sky-500/20', label: 'X (Twitter)' },
    youtube: { icon: YoutubeLogo, color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'YouTube' },
    linkedin: { icon: LinkedinLogo, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20', label: 'LinkedIn' },
    generic: { icon: Article, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: 'Generic' },
};

interface TemplateDetailProps {
    template: Template;
}

export function TemplateDetail({ template }: TemplateDetailProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(template.template_text || '');
    const [editedNotes, setEditedNotes] = useState(template.instructions || '');
    const [isPending, startTransition] = useTransition();

    const platform = platformConfig[template.platform_type];
    const Icon = platform.icon;
    const hasTemplateText = template.template_text && template.template_text.trim().length > 0;
    const examplesCount = template.examples?.length || 0;

    const handleCopyTemplate = async () => {
        if (!template.template_text) return;
        await navigator.clipboard.writeText(template.template_text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = () => {
        if (!confirm('Delete this template?')) return;
        startTransition(async () => {
            await deleteTemplate(template.id);
            router.push('/app/templates');
        });
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateTemplate(template.id, {
                template_text: editedText.trim() || null,
                instructions: editedNotes.trim() || null,
            });
            setIsEditing(false);
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/app/templates"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyTemplate}
                        disabled={!hasTemplateText}
                        className="gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-green-500" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                        className="gap-2"
                    >
                        <PencilSimple className="h-4 w-4" />
                        {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="gap-2 text-destructive hover:text-destructive"
                    >
                        {isPending ? (
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash className="h-4 w-4" />
                        )}
                        Delete
                    </Button>
                </div>
            </div>

            {/* Platform badge */}
            <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${platform.color}`}>
                    <Icon className="h-4 w-4" weight="fill" />
                    <span className="text-sm font-medium">{platform.label}</span>
                </div>
                {template.name && (
                    <span className="text-muted-foreground">•</span>
                )}
                {template.name && (
                    <span className="text-muted-foreground">{template.name}</span>
                )}
            </div>

            {/* Preview or Edit */}
            {isEditing ? (
                <div className="space-y-4">
                    <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        placeholder="Template content..."
                        rows={10}
                        className="w-full px-4 py-4 rounded-2xl border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm leading-relaxed"
                    />

                    <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Notes..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isPending} className="gap-2">
                            {isPending ? (
                                <SpinnerGap className="h-4 w-4 animate-spin" />
                            ) : null}
                            Save Changes
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Platform-specific preview */}
                    {hasTemplateText && (
                        <PlatformPreview
                            platform={template.platform_type}
                            content={template.template_text!}
                        />
                    )}

                    {/* Placeholders */}
                    {hasTemplateText && (
                        <PlaceholderList templateText={template.template_text!} />
                    )}
                </>
            )}

            {/* Notes */}
            {template.instructions && !isEditing && (
                <div className="p-4 rounded-xl bg-muted/30 border border-muted">
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{template.instructions}</p>
                </div>
            )}

            {/* Examples */}
            {examplesCount > 0 && !isEditing && (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Examples</p>
                    <ExamplesList examples={template.examples!} templateText={template.template_text || undefined} />
                </div>
            )}
        </div>
    );
}
