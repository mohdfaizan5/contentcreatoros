'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Inspiration, CreateInspirationInput, UpdateInspirationInput } from '@/types/database';

export async function getInspirations(): Promise<Inspiration[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('inspiration')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getInspiration(id: string): Promise<Inspiration | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('inspiration')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function createInspiration(input: CreateInspirationInput): Promise<Inspiration> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('inspiration')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/inspiration');
    return data;
}

export async function updateInspiration(id: string, input: UpdateInspirationInput): Promise<Inspiration> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('inspiration')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/inspiration');
    return data;
}

export async function deleteInspiration(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('inspiration')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/inspiration');
}
