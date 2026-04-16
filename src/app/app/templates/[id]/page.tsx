import { getCanAutoScheduleTweets, getGeneratedTweetsForTemplate } from '@/actions/generated-tweets';
import { getTemplate } from '@/actions/templates';
import { TemplateDetail } from '@/components/templates/template-detail';
import { createClient } from '@/lib/server';
import { notFound } from 'next/navigation';

interface TemplateDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const template = await getTemplate(id);

    if (!template) {
        notFound();
    }

    const [generatedTweets, canAutoSchedule] = await Promise.all([
        getGeneratedTweetsForTemplate(id),
        getCanAutoScheduleTweets(),
    ]);

    return (
        <TemplateDetail
            template={template}
            currentUserId={user?.id ?? null}
            generatedTweets={generatedTweets}
            canAutoSchedule={canAutoSchedule}
        />
    );
}
