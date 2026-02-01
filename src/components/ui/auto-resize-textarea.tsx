'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    minRows?: number;
    maxRows?: number;
}

/**
 * Textarea that automatically adjusts height based on content
 * Adds 1 extra line beyond the content for comfortable typing
 */
export function AutoResizeTextarea({
    minRows = 3,
    maxRows = 20,
    value,
    onChange,
    className = '',
    ...props
}: AutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';

        // Calculate line height
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseInt(computedStyle.lineHeight) || 24;
        const paddingTop = parseInt(computedStyle.paddingTop) || 0;
        const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;

        // Calculate min and max heights
        const minHeight = lineHeight * minRows + paddingTop + paddingBottom;
        const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

        // Get content height and add one extra line for comfort
        const contentHeight = textarea.scrollHeight;
        const targetHeight = contentHeight + lineHeight; // +1 line

        // Clamp between min and max
        const finalHeight = Math.min(Math.max(targetHeight, minHeight), maxHeight);

        textarea.style.height = `${finalHeight}px`;
    }, [minRows, maxRows]);

    // Adjust on value change
    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    // Adjust on mount
    useEffect(() => {
        adjustHeight();
    }, [adjustHeight]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={`resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
}
