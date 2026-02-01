// Utility functions for parsing and working with Mad Libs-style template placeholders

export interface ParsedPlaceholder {
    name: string;
    start: number;
    end: number;
}

export interface ParsedTemplate {
    text: string;
    placeholders: ParsedPlaceholder[];
}

/**
 * Parse a template string and extract all [placeholder] patterns
 * @param templateText The template text with [placeholder] syntax
 * @returns Parsed template with placeholder information
 */
export function parseTemplatePlaceholders(templateText: string): ParsedTemplate {
    const placeholders: ParsedPlaceholder[] = [];
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(templateText)) !== null) {
        placeholders.push({
            name: match[1],
            start: match.index,
            end: match.index + match[0].length,
        });
    }

    return {
        text: templateText,
        placeholders,
    };
}

/**
 * Get unique placeholder names from a template
 * @param templateText The template text with [placeholder] syntax
 * @returns Array of unique placeholder names
 */
export function getUniquePlaceholders(templateText: string): string[] {
    const parsed = parseTemplatePlaceholders(templateText);
    const uniqueNames = [...new Set(parsed.placeholders.map(p => p.name))];
    return uniqueNames;
}

/**
 * Fill a template with provided values
 * @param templateText The template text with [placeholder] syntax
 * @param values Object mapping placeholder names to their values
 * @returns Filled template string
 */
export function fillTemplate(templateText: string, values: Record<string, string>): string {
    let result = templateText;

    for (const [name, value] of Object.entries(values)) {
        const regex = new RegExp(`\\[${escapeRegex(name)}\\]`, 'g');
        result = result.replace(regex, value);
    }

    return result;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect embed type from a URL
 * @param url The URL to analyze
 * @returns The embed type
 */
export function detectEmbedType(url: string): 'x' | 'instagram' | 'linkedin' | 'link' {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        return 'x';
    }
    if (lowerUrl.includes('instagram.com')) {
        return 'instagram';
    }
    if (lowerUrl.includes('linkedin.com')) {
        return 'linkedin';
    }

    return 'link';
}

/**
 * Extract tweet ID from X/Twitter URL
 */
export function extractTweetId(url: string): string | null {
    const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Generate a simple UUID for client-side use
 */
export function generateId(): string {
    return crypto.randomUUID();
}
