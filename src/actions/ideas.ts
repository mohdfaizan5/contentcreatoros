/**
 * Ideas Server Actions
 * Simplified actions for creating, reading, updating and deleting ideas
 */

'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Idea, CreateIdeaInput, UpdateIdeaInput } from '@/types/database';

/**
 * Get all ideas for the current user
 */
export async function getIdeas(): Promise<Idea[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get a single idea by ID
 */
export async function getIdea(id: string): Promise<Idea | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

/**
 * Create a new idea
 */
export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ideas')
        .insert({
            title: input.title,
            raw_text: input.raw_text || null,
            content: input.content || null,
            user_id: userData.user.id,
            // Default values for backwards compatibility
            idea_type: 'standalone',
            status: 'dumped',
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/ideas');
    return data;
}

/**
 * Update an existing idea
 */
export async function updateIdea(id: string, input: UpdateIdeaInput): Promise<Idea> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ideas')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/ideas');
    revalidatePath(`/app/ideas/${id}`);
    return data;
}

/**
 * Delete an idea
 */
export async function deleteIdea(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/ideas');
}
