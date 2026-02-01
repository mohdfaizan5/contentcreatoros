'use client';

import { useTransition } from 'react';
import { FileText, Trash, TwitterLogo, YoutubeLogo, LinkedinLogo, Article, SpinnerGap, Eye, Quotes, Link as LinkIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { deleteTemplate } from '@/actions/templates';
import { PlaceholderRenderer } from './placeholder-renderer';
import type { Template, PlatformType } from '@/types/database';
import Link from 'next/link';

const platformIcons: Record<PlatformType, React.ElementType> = {
    x: TwitterLogo,
    youtube: YoutubeLogo,
    linkedin: LinkedinLogo,
    generic: Article,
};

const platformColors: Record<PlatformType, string> = {
    x: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    youtube: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    linkedin: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/20',
    generic: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
};

interface TemplateCardProps {
    template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
    const [isPending, startTransition] = useTransition();
    const Icon = platformIcons[template.platform_type];
    const colorClass = platformColors[template.platform_type];

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this template?')) return;
        startTransition(async () => {
            await deleteTemplate(template.id);
        });
    };

    const details = [
        template.hook_style && `Hook: ${template.hook_style}`,
        template.length && `Length: ${template.length}`,
        template.tone && `Tone: ${template.tone}`,
        template.cta_style && `CTA: ${template.cta_style}`,
    ].filter(Boolean);

    const examplesCount = template.examples?.length || 0;
    const referencesCount = template.reference_links?.length || 0;
    const hasTemplateText = template.template_text && template.template_text.trim().length > 0;

    return (
        <Link
            href={`/app/templates/${template.id}`}
            className="group relative rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
        >
            {/* Platform indicator bar */}
            <div className={`h-1 w-full ${colorClass.includes('bg-') ? colorClass.split(' ')[0] : 'bg-primary/20'}`} />

            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${colorClass}`}>
                                <Icon className="h-5 w-5" weight="fill" />
                            </div>
                            <div>
                                <h3 className="font-semibold group-hover:text-primary transition-colors">{template.name}</h3>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {template.platform_type === 'x' ? 'X (Twitter)' : template.platform_type}
                                </p>
                            </div>
                        </div>

                        {/* Template text preview */}
                        {hasTemplateText && (
                            <div className="mb-3 p-3 rounded-xl bg-muted/50 border border-muted">
                                <div className="text-sm line-clamp-3">
                                    <PlaceholderRenderer templateText={template.template_text!} />
                                </div>
                            </div>
                        )}

                        {/* Details badges */}
                        {details.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {details.map((detail, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-muted text-muted-foreground"
                                    >
                                        {detail}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Instructions preview */}
                        {template.instructions && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.instructions}
                            </p>
                        )}

                        {/* Stats row */}
                        {(examplesCount > 0 || referencesCount > 0) && (
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                                {examplesCount > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Quotes className="h-3.5 w-3.5" weight="duotone" />
                                        <span>{examplesCount} example{examplesCount !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                                {referencesCount > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <LinkIcon className="h-3.5 w-3.5" weight="duotone" />
                                        <span>{referencesCount} reference{referencesCount !== 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={handleDelete}
                            disabled={isPending}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            {isPending ? (
                                <SpinnerGap className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

interface TemplatesGridProps {
    templates: Template[];
}

export function TemplatesGrid({ templates }: TemplatesGridProps) {
    if (templates.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed bg-muted/20">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground/50" weight="duotone" />
                </div>
                <h3 className="font-semibold text-muted-foreground">No templates yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Create your first template to build a library of content frameworks
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
            ))}
        </div>
    );
}
