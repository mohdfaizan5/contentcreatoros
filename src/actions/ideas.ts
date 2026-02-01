'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Idea, CreateIdeaInput, UpdateIdeaInput, IdeaWithSeries } from '@/types/database';

export async function getIdeas(): Promise<IdeaWithSeries[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ideas')
        .select(`
      *,
      series:series!fk_ideas_linked_series (*),
      template:templates (*)
    `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getIdea(id: string): Promise<IdeaWithSeries | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ideas')
        .select(`
      *,
      series:series!fk_ideas_linked_series (*),
      template:templates (*)
    `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function getIdeasByStatus(status: string): Promise<Idea[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', status)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getIdeasBySeries(seriesId: string): Promise<Idea[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('linked_series_id', seriesId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createIdea(input: CreateIdeaInput): Promise<Idea> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('ideas')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/ideas');
    revalidatePath('/app/planning');
    return data;
}

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
    revalidatePath('/app/planning');
    revalidatePath('/app/series');
    return data;
}

export async function deleteIdea(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/ideas');
    revalidatePath('/app/planning');
    revalidatePath('/app/series');
}

export async function updateIdeaStatus(id: string, status: Idea['status']): Promise<Idea> {
    return updateIdea(id, { status });
}

export async function linkIdeaToSeries(ideaId: string, seriesId: string | null): Promise<Idea> {
    return updateIdea(ideaId, { linked_series_id: seriesId });
}
