/**
 * Reusable Editor.js component for rich text editing
 * Used in Ideas feature for capturing content with formatting
 */

'use client';

import { useEffect, useRef } from 'react';
import type EditorJS from '@editorjs/editorjs';
import type { EditorJSData } from '@/types/database';

// Editor.js tools
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';

interface EditorProps {
    data?: EditorJSData;
    onChange?: (data: EditorJSData) => void;
    placeholder?: string;
    readOnly?: boolean;
}

export default function Editor({ data, onChange, placeholder = 'Start writing...', readOnly = false }: EditorProps) {
    // Don't show placeholder in readOnly mode - it confuses users
    const editorPlaceholder = readOnly ? '' : placeholder;
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!holderRef.current) return;

        let isMounted = true;

        const initEditor = async () => {
            // Check if already initializing or initialized to prevent double init
            if (editorRef.current) return;

            const EditorJS = (await import('@editorjs/editorjs')).default;

            // Check again after async import
            if (!isMounted || editorRef.current) return;

            const editor = new EditorJS({
                holder: holderRef.current!,
                placeholder: editorPlaceholder,
                readOnly,
                data: data || { blocks: [] },
                tools: {
                    header: {
                        class: Header as any,
                        inlineToolbar: true,
                        config: {
                            levels: [1, 2, 3],
                            defaultLevel: 2,
                        },
                    },
                    list: {
                        class: List as any,
                        inlineToolbar: true,
                    },
                    paragraph: {
                        class: Paragraph as any,
                        inlineToolbar: true,
                    },
                    quote: {
                        class: Quote as any,
                        inlineToolbar: true,
                    },
                    code: Code,
                },
                onReady: () => {
                    const Undo = require('editorjs-undo');
                    new Undo({ editor });
                },
                onChange: async () => {
                    if (onChange && !readOnly) {
                        const outputData = await editor.save();
                        onChange(outputData);
                    }
                },
            });

            await editor.isReady;

            // If component unmounted while checking isReady, destroy the editor
            if (!isMounted) {
                if (editor.destroy) {
                    editor.destroy();
                }
                return;
            }

            editorRef.current = editor;
        };

        if (!editorRef.current) {
            initEditor();
        }

        return () => {
            isMounted = false;
            if (editorRef.current && editorRef.current.destroy) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, []); // Only run once on mount

    return (
        <div
            ref={holderRef}
            className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] focus:outline-none"
        />
    );
}
