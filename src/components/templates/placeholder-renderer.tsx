'use client';

import { useMemo } from 'react';
import { parseTemplatePlaceholders } from '@/lib/template-utils';

interface PlaceholderRendererProps {
    templateText: string;
    values?: Record<string, string>;
    className?: string;
    mode?: 'preview' | 'fill';
}

/**
 * Renders template text with highlighted placeholders
 * In preview mode: shows placeholders as styled badges
 * In fill mode: shows filled values with highlighting
 */
export function PlaceholderRenderer({
    templateText,
    values = {},
    className = '',
    mode = 'preview'
}: PlaceholderRendererProps) {
    const parts = useMemo(() => {
        const parsed = parseTemplatePlaceholders(templateText);
        const result: Array<{ type: 'text' | 'placeholder'; content: string; name?: string }> = [];
        let lastIndex = 0;

        for (const placeholder of parsed.placeholders) {
            // Add text before this placeholder
            if (placeholder.start > lastIndex) {
                result.push({
                    type: 'text',
                    content: templateText.slice(lastIndex, placeholder.start),
                });
            }

            // Add the placeholder
            result.push({
                type: 'placeholder',
                content: values[placeholder.name] || `[${placeholder.name}]`,
                name: placeholder.name,
            });

            lastIndex = placeholder.end;
        }

        // Add remaining text
        if (lastIndex < templateText.length) {
            result.push({
                type: 'text',
                content: templateText.slice(lastIndex),
            });
        }

        return result;
    }, [templateText, values]);

    return (
        <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
            {parts.map((part, index) => {
                if (part.type === 'text') {
                    return <span key={index}>{part.content}</span>;
                }

                const isFilled = part.name && values[part.name];

                if (mode === 'fill' && isFilled) {
                    // Show filled value with subtle highlight
                    return (
                        <span
                            key={index}
                            className="bg-primary/10 text-primary font-medium px-0.5 rounded"
                        >
                            {part.content}
                        </span>
                    );
                }

                // Show as placeholder badge
                return (
                    <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    >
                        {part.content}
                    </span>
                );
            })}
        </div>
    );
}

interface PlaceholderListProps {
    templateText: string;
    className?: string;
}

/**
 * Shows a list of unique placeholders found in the template
 */
export function PlaceholderList({ templateText, className = '' }: PlaceholderListProps) {
    const placeholders = useMemo(() => {
        const parsed = parseTemplatePlaceholders(templateText);
        return [...new Set(parsed.placeholders.map(p => p.name))];
    }, [templateText]);

    if (placeholders.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <p className="text-xs text-muted-foreground mb-2">
                {placeholders.length} placeholder{placeholders.length !== 1 ? 's' : ''} detected:
            </p>
            <div className="flex flex-wrap gap-1.5">
                {placeholders.map((name) => (
                    <span
                        key={name}
                        className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    >
                        {name}
                    </span>
                ))}
            </div>
        </div>
    );
}
