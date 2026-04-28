import { getTemplates } from '@/features/templates/actions/templates';
import { TemplatesClient } from '@/features/templates/components/templates-client';
import { createClient } from '@/shared/lib/supabase/server';

export default async function TemplatesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const templates = await getTemplates();

    return <TemplatesClient templates={templates} currentUserId={user?.id ?? null} />;
}

