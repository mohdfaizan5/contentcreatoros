'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { LinkProfile, Link, CreateLinkProfileInput, UpdateLinkProfileInput, CreateLinkInput, UpdateLinkInput, LinkProfileWithLinks } from '@/types/database';

export async function getMyProfile(): Promise<LinkProfileWithLinks | null> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return null;

    const { data, error } = await supabase
        .from('link_profiles')
        .select(`
      *,
      links (*)
    `)
        .eq('user_id', userData.user.id)
        .single();

    if (error) return null;

    // Sort links by order
    if (data?.links) {
        data.links.sort((a: Link, b: Link) => a.order - b.order);
    }

    return data;
}

export async function getPublicProfile(username: string): Promise<LinkProfileWithLinks | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('link_profiles')
        .select(`
      *,
      links (*)
    `)
        .eq('username', username)
        .single();

    if (error) return null;

    // Filter to only active links and sort by order
    if (data?.links) {
        data.links = data.links
            .filter((link: Link) => link.is_active)
            .sort((a: Link, b: Link) => a.order - b.order);
    }

    return data;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('link_profiles')
        .select('id')
        .eq('username', username)
        .single();

    return !data;
}

export async function claimUsername(input: CreateLinkProfileInput): Promise<LinkProfile> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    // Check if user already has a profile
    const { data: existing } = await supabase
        .from('link_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

    if (existing) {
        throw new Error('You already have a profile');
    }

    const { data, error } = await supabase
        .from('link_profiles')
        .insert({
            ...input,
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('This username is already taken');
        }
        throw error;
    }

    revalidatePath('/app/public-profile');
    return data;
}

export async function updateProfile(input: UpdateLinkProfileInput): Promise<LinkProfile> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('link_profiles')
        .update(input)
        .eq('user_id', userData.user.id)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error('This username is already taken');
        }
        throw error;
    }

    revalidatePath('/app/public-profile');
    return data;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function uploadProfileLogo(formData: FormData): Promise<string> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 2MB');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Generate unique filename
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${userData.user.id}/${Date.now()}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('public_profile_pictures')
        .upload(filename, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('public_profile_pictures')
        .getPublicUrl(data.path);

    // Update profile with new logo URL
    await updateProfile({ logo_url: urlData.publicUrl });

    revalidatePath('/app/public-profile');
    return urlData.publicUrl;
}

export async function createLink(input: CreateLinkInput): Promise<Link> {
    const supabase = await createClient();

    // Get the max order for this profile
    const { data: maxOrder } = await supabase
        .from('links')
        .select('order')
        .eq('profile_id', input.profile_id)
        .order('order', { ascending: false })
        .limit(1)
        .single();

    const newOrder = (maxOrder?.order ?? -1) + 1;

    const { data, error } = await supabase
        .from('links')
        .insert({
            ...input,
            order: input.order ?? newOrder,
        })
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/public-profile');
    return data;
}

export async function updateLink(id: string, input: UpdateLinkInput): Promise<Link> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('links')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/public-profile');
    return data;
}

export async function deleteLink(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

    if (error) throw error;

    revalidatePath('/app/public-profile');
}

export async function reorderLinks(profileId: string, linkIds: string[]): Promise<void> {
    const supabase = await createClient();

    // Update each link with its new order
    const updates = linkIds.map((id, index) =>
        supabase
            .from('links')
            .update({ order: index })
            .eq('id', id)
            .eq('profile_id', profileId)
    );

    await Promise.all(updates);

    revalidatePath('/app/public-profile');
}

export async function toggleLink(id: string): Promise<Link> {
    const supabase = await createClient();

    // Get current state
    const { data: current } = await supabase
        .from('links')
        .select('is_active')
        .eq('id', id)
        .single();

    const { data, error } = await supabase
        .from('links')
        .update({ is_active: !current?.is_active })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    revalidatePath('/app/public-profile');
    return data;
}
