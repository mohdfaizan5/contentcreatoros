'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Series, CreateSeriesInput, UpdateSeriesInput, SeriesWithIdeas } from '@/types/database';

export async function getSeries(): Promise<SeriesWithIdeas[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('series')
        .select(`
      *,
      ideas:ideas!fk_ideas_linked_series (*),
      origin_idea:ideas!series_origin_idea_id_fkey (*)
    `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getSeriesById(id: string): Promise<SeriesWithIdeas | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('series')
        .select(`
      *,
      ideas:ideas!fk_ideas_linked_series (*),
      origin_idea:ideas!series_origin_idea_id_fkey (*)
    `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function createSeries(input: CreateSeriesInput): Promise<Series> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('series')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/series');
    revalidatePath('/app/planning');
    return data;
}

export async function updateSeries(id: string, input: UpdateSeriesInput): Promise<Series> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('series')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/series');
    revalidatePath('/app/planning');
    return data;
}

export async function deleteSeries(id: string): Promise<void> {
    const supabase = await createClient();

    // First unlink all ideas from this series
    await supabase
        .from('ideas')
        .update({ linked_series_id: null })
        .eq('linked_series_id', id);

    const { error } = await supabase
        .from('series')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/series');
    revalidatePath('/app/planning');
    revalidatePath('/app/ideas');
}

export async function expandSeriesConcept(
    seriesConceptId: string,
    seriesName: string,
    platform: string | null,
    itemTitles: string[]
): Promise<Series> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    // Create the series
    const { data: series, error: seriesError } = await supabase
        .from('series')
        .insert({
            name: seriesName,
            target_platform: platform,
            total_planned_items: itemTitles.length,
            origin_idea_id: seriesConceptId,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (seriesError) throw seriesError;

    // Create individual ideas for each item
    const ideas = itemTitles.map((title, index) => ({
        title: `Part ${index + 1}: ${title}`,
        idea_type: 'standalone' as const,
        status: 'dumped' as const,
        linked_series_id: series.id,
        target_platform: platform,
        user_id: userData.user.id,
    }));

    const { error: ideasError } = await supabase
        .from('ideas')
        .insert(ideas);

    if (ideasError) throw ideasError;

    // Update the original series concept to link to the series
    await supabase
        .from('ideas')
        .update({ linked_series_id: series.id })
        .eq('id', seriesConceptId);

    revalidatePath('/app/series');
    revalidatePath('/app/planning');
    revalidatePath('/app/ideas');

    return series;
}

export async function attachIdeaToSeries(ideaId: string, seriesId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('ideas')
        .update({ linked_series_id: seriesId })
        .eq('id', ideaId);

    if (error) throw error;

    revalidatePath('/app/series');
    revalidatePath('/app/planning');
    revalidatePath('/app/ideas');
}
