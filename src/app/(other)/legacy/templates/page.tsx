import { getTemplates } from '@/features/templates/actions/templates';
import { TemplatesClient } from '@/features/(legacy)/templates/components/templates-client';

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return <TemplatesClient templates={templates} />;
}

