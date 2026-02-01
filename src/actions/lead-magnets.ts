'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { LeadMagnet, Lead, CreateLeadMagnetInput, UpdateLeadMagnetInput, CreateLeadInput, LeadMagnetWithLeads } from '@/types/database';

export async function getMagnets(): Promise<LeadMagnetWithLeads[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('lead_magnets')
        .select(`
      *,
      leads (count)
    `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((magnet: LeadMagnetWithLeads & { leads: { count: number }[] }) => ({
        ...magnet,
        lead_count: magnet.leads?.[0]?.count ?? 0,
        leads: undefined,
    }));
}

export async function getMagnet(id: string): Promise<LeadMagnetWithLeads | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lead_magnets')
        .select(`
      *,
      leads (*)
    `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data;
}

export async function getPublicMagnet(slug: string): Promise<LeadMagnet | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lead_magnets')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

    if (error) return null;
    return data;
}

export async function createMagnet(input: CreateLeadMagnetInput): Promise<LeadMagnet> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('lead_magnets')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('A lead magnet with this slug already exists');
        }
        throw error;
    }

    revalidatePath('/app/lead-magnets');
    return data;
}

export async function updateMagnet(id: string, input: UpdateLeadMagnetInput): Promise<LeadMagnet> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lead_magnets')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('A lead magnet with this slug already exists');
        }
        throw error;
    }

    revalidatePath('/app/lead-magnets');
    return data;
}

export async function deleteMagnet(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('lead_magnets')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/lead-magnets');
}

export async function captureLead(input: CreateLeadInput): Promise<Lead> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('leads')
        .insert(input)
        .select()
        .single();

    if (error) throw error;

    return data;
}

export async function getLeads(magnetId: string): Promise<Lead[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('magnet_id', magnetId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function deleteLead(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/lead-magnets');
}

export async function exportLeadsCsv(magnetId: string): Promise<string> {
    const leads = await getLeads(magnetId);

    if (leads.length === 0) {
        return 'email,name,created_at\n';
    }

    const header = 'email,name,created_at\n';
    const rows = leads.map(lead =>
        `"${lead.email}","${lead.name || ''}","${lead.created_at}"`
    ).join('\n');

    return header + rows;
}
