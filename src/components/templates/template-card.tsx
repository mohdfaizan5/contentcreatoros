'use client';

import { useTransition } from 'react';
import { FileText, Trash, TwitterLogo, YoutubeLogo, LinkedinLogo, Article } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { deleteTemplate } from '@/actions/templates';
import type { Template, PlatformType } from '@/types/database';

const platformIcons: Record<PlatformType, React.ElementType> = {
    x: TwitterLogo,
    youtube: YoutubeLogo,
    linkedin: LinkedinLogo,
    generic: Article,
};

const platformColors: Record<PlatformType, string> = {
    x: 'bg-black text-white',
    youtube: 'bg-red-500/10 text-red-600',
    linkedin: 'bg-blue-600/10 text-blue-600',
    generic: 'bg-gray-500/10 text-gray-600',
};

interface TemplateCardProps {
    template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
    const [isPending, startTransition] = useTransition();
    const Icon = platformIcons[template.platform_type];
    const colorClass = platformColors[template.platform_type];

    const handleDelete = () => {
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

    return (
        <div className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                            <Icon className="h-5 w-5" weight="fill" />
                        </div>
                        <div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-xs text-muted-foreground capitalize">
                                {template.platform_type === 'x' ? 'X (Twitter)' : template.platform_type}
                            </p>
                        </div>
                    </div>

                    {details.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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

                    {template.instructions && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {template.instructions}
                        </p>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface TemplatesGridProps {
    templates: Template[];
}

export function TemplatesGrid({ templates }: TemplatesGridProps) {
    if (templates.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No templates yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Create your first thinking scaffold
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
