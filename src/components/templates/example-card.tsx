'use client';

import { TwitterLogo, LinkedinLogo, InstagramLogo, Link as LinkIcon, ArrowSquareOut, User } from '@phosphor-icons/react';
import type { TemplateExample, PlatformType } from '@/types/database';
import { PlaceholderRenderer } from './placeholder-renderer';

const platformConfig: Record<PlatformType, { icon: React.ElementType; color: string; label: string }> = {
    x: { icon: TwitterLogo, color: 'text-sky-500 bg-sky-500/10', label: 'X' },
    youtube: { icon: LinkIcon, color: 'text-red-500 bg-red-500/10', label: 'YouTube' },
    linkedin: { icon: LinkedinLogo, color: 'text-blue-600 bg-blue-600/10', label: 'LinkedIn' },
    generic: { icon: LinkIcon, color: 'text-gray-500 bg-gray-500/10', label: 'Generic' },
};

interface ExampleCardProps {
    example: TemplateExample;
    templateText?: string;
    onDelete?: () => void;
}

/**
 * Displays a template example with highlighted content
 */
export function ExampleCard({ example, templateText, onDelete }: ExampleCardProps) {
    const platform = example.platform ? platformConfig[example.platform] : null;
    const Icon = platform?.icon || LinkIcon;

    return (
        <div className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    {example.author && (
                        <>
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" weight="duotone" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{example.author}</p>
                                {platform && (
                                    <p className="text-xs text-muted-foreground">{platform.label}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {example.source_url && (
                        <a
                            href={example.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                            <ArrowSquareOut className="h-4 w-4 text-muted-foreground" />
                        </a>
                    )}
                    {platform && (
                        <div className={`p-1.5 rounded-lg ${platform.color}`}>
                            <Icon className="h-4 w-4" weight="fill" />
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="text-sm leading-relaxed">
                {templateText ? (
                    // Show with placeholder highlighting based on template
                    <ExampleWithHighlights content={example.content} templateText={templateText} />
                ) : (
                    <p className="whitespace-pre-wrap">{example.content}</p>
                )}
            </div>
        </div>
    );
}

interface ExampleWithHighlightsProps {
    content: string;
    templateText: string;
}

/**
 * Highlights parts of the example that correspond to template placeholders
 * This is a simplified version - a more advanced implementation would
 * use fuzzy matching to detect which parts map to which placeholders
 */
function ExampleWithHighlights({ content, templateText }: ExampleWithHighlightsProps) {
    // For now, just render the content with a subtle background
    // A more advanced version would parse the template and highlight matches
    return (
        <p className="whitespace-pre-wrap">
            {content}
        </p>
    );
}

interface ExamplesListProps {
    examples: TemplateExample[];
    templateText?: string;
}

/**
 * Grid of example cards
 */
export function ExamplesList({ examples, templateText }: ExamplesListProps) {
    if (examples.length === 0) {
        return (
            <div className="text-center py-8 rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">No examples yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add examples to show this template in action</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {examples.map((example) => (
                <ExampleCard key={example.id} example={example} templateText={templateText} />
            ))}
        </div>
    );
}
