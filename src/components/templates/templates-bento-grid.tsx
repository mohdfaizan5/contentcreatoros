'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Plus, PushPin, Trash, SpinnerGap, TwitterLogo, YoutubeLogo, LinkedinLogo, Article } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { deleteTemplate, updateTemplate } from '@/actions/templates';
import { PlaceholderRenderer } from './placeholder-renderer';
import type { Template, PlatformType } from '@/types/database';

const platformConfig: Record<PlatformType, { icon: React.ElementType; color: string; bgColor: string }> = {
    x: { icon: TwitterLogo, color: 'text-sky-500', bgColor: 'bg-sky-500/5 border-sky-500/20 hover:border-sky-500/40' },
    linkedin: { icon: LinkedinLogo, color: 'text-blue-600', bgColor: 'bg-blue-600/5 border-blue-600/20 hover:border-blue-600/40' },
    youtube: { icon: YoutubeLogo, color: 'text-red-500', bgColor: 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' },
    generic: { icon: Article, color: 'text-gray-500', bgColor: 'bg-gray-500/5 border-gray-500/20 hover:border-gray-500/40' },
};

interface TemplateMasonryCardProps {
    template: Template;
    isPinned?: boolean;
}

function TemplateMasonryCard({ template, isPinned = false }: TemplateMasonryCardProps) {
    const [isPending, startTransition] = useTransition();
    const config = platformConfig[template.platform_type];
    const Icon = config.icon;

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this template?')) return;
        startTransition(async () => {
            await deleteTemplate(template.id);
        });
    };

    const handlePin = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            await updateTemplate(template.id, {
                structure_fields: {
                    ...template.structure_fields as Record<string, unknown>,
                    isPinned: !isPinned
                }
            });
        });
    };

    const hasContent = template.template_text && template.template_text.trim().length > 0;

    return (
        <Link
            href={`/app/templates/${template.id}`}
            className={`group block rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${config.bgColor}`}
            style={{ breakInside: 'avoid' }}
        >
            {/* Header with icon and actions */}
            <div className="flex items-center justify-between p-3 pb-0">
                <Icon className={`h-4 w-4 ${config.color}`} weight="fill" />

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handlePin}
                        disabled={isPending}
                        className={`p-1 rounded-md transition-colors ${isPinned
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <PushPin className="h-3.5 w-3.5" weight={isPinned ? 'fill' : 'regular'} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        {isPending ? (
                            <SpinnerGap className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Trash className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 pt-2">
                {hasContent ? (
                    <PlaceholderRenderer
                        templateText={template.template_text!}
                        className="text-sm leading-relaxed"
                    />
                ) : (
                    <div className="space-y-1">
                        <p className="font-medium text-sm">{template.name}</p>
                        {template.instructions && (
                            <p className="text-xs text-muted-foreground">{template.instructions}</p>
                        )}
                    </div>
                )}

                {/* Name at bottom if has content */}
                {hasContent && template.name && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{template.name}</p>
                )}
            </div>
        </Link>
    );
}

interface TemplatesMasonryGridProps {
    templates: Template[];
}

export function TemplatesMasonryGrid({ templates }: TemplatesMasonryGridProps) {
    // Separate pinned and unpinned
    const pinned = templates.filter(t => (t.structure_fields as Record<string, unknown>)?.isPinned === true);
    const unpinned = templates.filter(t => (t.structure_fields as Record<string, unknown>)?.isPinned !== true);

    if (templates.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed bg-muted/20">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Article className="h-8 w-8 text-muted-foreground/50" weight="duotone" />
                </div>
                <h3 className="font-semibold text-muted-foreground">No templates yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                    Create your first content framework
                </p>
                <Link href="/app/templates/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Template
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Pinned templates */}
            {pinned.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <PushPin className="h-4 w-4 text-amber-500" weight="fill" />
                        <span className="text-sm font-medium text-muted-foreground">Pinned</span>
                    </div>
                    <div
                        className="columns-2 md:columns-2 gap-4"
                        style={{ columnFill: 'balance' }}
                    >
                        {pinned.map((template) => (
                            <div key={template.id} className="mb-4">
                                <TemplateMasonryCard template={template} isPinned={true} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All templates */}
            {unpinned.length > 0 && (
                <div>
                    {pinned.length > 0 && (
                        <p className="text-sm font-medium text-muted-foreground mb-3">All Templates</p>
                    )}
                    <div
                        className="columns-2 md:columns-2  gap-4"
                        style={{ columnFill: 'balance' }}
                    >
                        {unpinned.map((template) => (
                            <div key={template.id} className="mb-4">
                                <TemplateMasonryCard template={template} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
