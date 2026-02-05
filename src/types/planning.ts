// Database types for Content Planning (V1)

import type { EditorJSData, ContentCard, UserWorkflow } from './database';

// Re-export types from database for convenience
export type { EditorJSData, ContentCard, UserWorkflow } from './database';

// ============================================
// CREATE/UPDATE INPUT TYPES
// ============================================

export interface CreateContentCardInput {
    title: string;
    description?: string | null;
    idea_id?: string | null;
    platforms: string[];
    content_type?: string | null;
    series_id?: string | null;
    column_id: string; // Which kanban column
    order?: number;
}

export interface UpdateContentCardInput {
    title?: string;
    description?: string | null;
    idea_id?: string | null;
    platforms?: string[];
    content_type?: string | null;
    series_id?: string | null;
    column_id?: string;
    checked?: boolean;
    order?: number;
}

export interface CreateUserWorkflowInput {
    columns: string[]; // e.g., ['Starting Point', 'Edited', 'Done']
}

export interface UpdateUserWorkflowInput {
    columns: string[];
}

// ============================================
// EXTENDED TYPES (with relations)
// ============================================

export interface ContentCardWithRelations extends ContentCard {
    idea?: {
        id: string;
        title: string;
        content: EditorJSData | null;
    } | null;
    series?: {
        id: string;
        name: string;
    } | null;
}

// ============================================
// PRESET WORKFLOWS
// ============================================

export const PRESET_WORKFLOWS = {
    simple: {
        name: 'Simple',
        description: 'Basic workflow for quick content creation',
        columns: ['Starting Point', 'Edited', 'Done'] as string[],
        className: 'w-full',
    },
    basicCreator: {
        name: 'Basic Creator',
        description: 'Standard content creation workflow',
        columns: ['Idea', 'Script', 'Record', 'Edit', 'Schedule'] as string[],
        className: 'w-full',
    },
    advanced: {
        name: 'Advanced',
        description: 'Detailed workflow  stages',
        columns: ['Script', 'Record Audio', 'Record Video', 'Edit', 'Schedule', 'Published'] as string[],

    },
};

export type PresetWorkflowKey = keyof typeof PRESET_WORKFLOWS;

// ============================================
// PLATFORM & CONTENT TYPE MAPPINGS
// ============================================

export const PLATFORMS = ['youtube', 'linkedin', 'twitter', 'tiktok', 'instagram', 'other'] as const;
export type Platform = typeof PLATFORMS[number];

export const CONTENT_TYPES: Record<string, string[]> = {
    youtube: ['Shorts', 'Long-form', 'Live Stream'],
    linkedin: ['Post', 'Article', 'Carousel', 'Newsletter'],
    twitter: ['Thread', 'Single Tweet', 'Spaces'],
    tiktok: ['Short Video', 'Live'],
    instagram: ['Reel', 'Post', 'Story', 'Carousel'],
    other: ['Generic'],
};

// Helper function to get content types for selected platforms
export function getContentTypesForPlatforms(platforms: string[]): string[] {
    if (platforms.length === 0) return [];

    const types = platforms.flatMap(platform => CONTENT_TYPES[platform] || []);
    return Array.from(new Set(types)); // Remove duplicates
}
