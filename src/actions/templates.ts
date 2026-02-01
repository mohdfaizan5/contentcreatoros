'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Template, CreateTemplateInput, UpdateTemplateInput } from '@/types/database';

export async function getTemplates(): Promise<Template[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getTemplate(id: string): Promise<Template | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function getTemplatesByPlatform(platform: string): Promise<Template[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('platform_type', platform)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/templates');
    return data;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<Template> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('templates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/templates');
    return data;
}

export async function deleteTemplate(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/templates');
}
