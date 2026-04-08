'use client';

import { useState } from 'react';
import { PlaceholderList } from './placeholder-renderer';

interface MadLibsEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

/**
 * Interactive editor for Mad Libs-style template text
 * Features:
 * - Textarea for template input
 * - Live placeholder detection
 * - Syntax hints
 */
export function MadLibsEditor({
    value,
    onChange,
    placeholder = 'Enter your template...',
    rows = 6
}: MadLibsEditorProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="space-y-3">
            {/* Editor */}
            <div className={`relative rounded-xl border transition-all duration-200 ${isFocused ? 'border-primary/50 ring-2 ring-primary/20' : ''
                }`}>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full px-4 py-3 rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none resize-none font-mono text-sm leading-relaxed"
                />
            </div>

            {/* Syntax hint */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="px-1.5 py-0.5 rounded bg-muted font-mono">[placeholder]</div>
                <span>Use square brackets to create fill-in-the-blank placeholders</span>
            </div>

            {/* Detected placeholders */}
            {value && <PlaceholderList templateText={value} />}
        </div>
    );
}
