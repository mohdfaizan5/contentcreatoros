import { getTemplates } from '@/actions/templates';
import { TemplatesClient } from '@/components/templates/templates-client';
import { createClient } from '@/lib/server';

export default async function TemplatesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const templates = await getTemplates();

    return <TemplatesClient templates={templates} currentUserId={user?.id ?? null} />;
}
