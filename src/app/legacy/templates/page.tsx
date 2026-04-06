import { getTemplates } from '@/actions/templates';
import { TemplatesClient } from '@/components/legacy/templates/templates-client';

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return <TemplatesClient templates={templates} />;
}
