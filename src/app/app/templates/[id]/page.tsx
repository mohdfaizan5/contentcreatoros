import { getTemplate } from '@/actions/templates';
import { TemplateDetail } from '@/components/templates/template-detail';
import { notFound } from 'next/navigation';

interface TemplateDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
    const { id } = await params;
    const template = await getTemplate(id);

    if (!template) {
        notFound();
    }

    return <TemplateDetail template={template} />;
}
