'use server';

import { createClient } from '@/lib/server';
import { revalidateAppPath, revalidateAppPaths } from '@/lib/revalidate-app-paths';
import type {
    PlatformType,
    Template,
    CreateTemplateInput,
    UpdateTemplateInput,
} from '@/types/database';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function attachTemplateEngagement(
    supabase: SupabaseClient,
    templates: Template[],
    userId: string,
): Promise<Template[]> {
    if (!templates.length) {
        return templates;
    }

    const templateIds = templates.map((template) => template.id);
    const { data: likesRows, error: likesError } = await supabase
        .from('template_likes')
        .select('template_id, user_id')
        .in('template_id', templateIds);

    if (likesError) {
        // Allow templates to work before the migration is applied.
        if (likesError.code === '42P01') {
            return templates.map((template) => ({
                ...template,
                likes_count: 0,
                liked_by_me: false,
            }));
        }
        throw likesError;
    }

    const likesCountByTemplate = new Map<string, number>();
    const likedByMe = new Set<string>();

    for (const row of likesRows ?? []) {
        const templateId = row.template_id as string;
        const likerId = row.user_id as string;

        likesCountByTemplate.set(templateId, (likesCountByTemplate.get(templateId) ?? 0) + 1);
        if (likerId === userId) {
            likedByMe.add(templateId);
        }
    }

    return templates.map((template) => ({
        ...template,
        likes_count: likesCountByTemplate.get(template.id) ?? 0,
        liked_by_me: likedByMe.has(template.id),
    }));
}

export async function getTemplates(platformType?: PlatformType): Promise<Template[]> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    let query = supabase
        .from('templates')
        .select('*')
        .eq('user_id', userData.user.id);

    if (platformType) {
        query = query.eq('platform_type', platformType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return attachTemplateEngagement(supabase, data || [], userData.user.id);
}

export async function getTemplate(id: string): Promise<Template | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
        return {
            ...data,
            likes_count: 0,
            liked_by_me: false,
        };
    }

    const [templateWithEngagement] = await attachTemplateEngagement(
        supabase,
        [data],
        userData.user.id,
    );

    return templateWithEngagement ?? data;
}

export async function getTemplatesByPlatform(platform: PlatformType): Promise<Template[]> {
    return getTemplates(platform);
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template> {
    const supabase = await createClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .insert({
            ...input,
            is_public: input.is_public ?? false,
            tags: input.tags ?? [],
            user_id: userData.user.id,
        })
        .select()
        .single();

    if (error) throw error;

    revalidateAppPath('/templates');
    return data;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput): Promise<Template> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .update(input)
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .select()
        .single();

    if (error) throw error;

    revalidateAppPaths(['/templates', `/templates/${id}`]);
    return data;
}

export async function deleteTemplate(id: string): Promise<void> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)
        .eq('user_id', userData.user.id);

    if (error) throw error;

    revalidateAppPaths(['/templates', `/templates/${id}`]);
}

export async function toggleTemplateVisibility(id: string, isPublic: boolean): Promise<Template> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('templates')
        .update({ is_public: isPublic })
        .eq('id', id)
        .eq('user_id', userData.user.id)
        .select()
        .single();
    if (error) throw error;
    revalidateAppPaths(['/templates', `/templates/${id}`]);
    return data;
}

export async function toggleTemplateLike(
    templateId: string,
    shouldLike: boolean,
): Promise<{ liked: boolean; likes_count: number }> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Not authenticated');
    const user_id = userData.user.id;

    if (shouldLike) {
        const { error } = await supabase
            .from('template_likes')
            .insert({ template_id: templateId, user_id });
        if (error && error.code !== '23505') throw error; // Ignore unique constraint error
    } else {
        const { error } = await supabase
            .from('template_likes')
            .delete()
            .eq('template_id', templateId)
            .eq('user_id', user_id);
        if (error) throw error;
    }

    const likesCount = await getTemplateLikesCount(templateId);
    revalidateAppPaths(['/templates', `/templates/${templateId}`]);

    return {
        liked: shouldLike,
        likes_count: likesCount,
    };
}

export async function getTemplateLikesCount(templateId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('template_likes')
        .select('*', { count: 'exact', head: true })
        .eq('template_id', templateId);

    if (error && error.code === '42P01') {
        return 0;
    }

    if (error) throw error;
    return count || 0;
}

export async function hasUserLikedTemplate(templateId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return false;

    const { data, error } = await supabase
        .from('template_likes')
        .select('id')
        .eq('template_id', templateId)
        .eq('user_id', userData.user.id)
        .maybeSingle();

    if (error && (error.code === '42P01' || error.code === 'PGRST116')) {
        return false;
    }

    if (error) throw error;

    return !!data;
}
