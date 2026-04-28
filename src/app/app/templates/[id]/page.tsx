import { getCanAutoScheduleTweets, getGeneratedTweetsForTemplate } from '@/features/(legacy)/templates/generated-tweets';
import { getTemplate } from '@/features/templates/actions/templates';
import { TemplateDetail } from '@/features/templates/components/template-detail';
import { listPublishingXAccountsForCurrentUser } from '@/features/x/lib/x-auth';
import { createClient } from '@/shared/lib/supabase/server';
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

    const [generatedTweets, canAutoSchedule, xAccounts] = await Promise.all([
        getGeneratedTweetsForTemplate(id),
        getCanAutoScheduleTweets(),
        listPublishingXAccountsForCurrentUser(),
    ]);

    return (
        <TemplateDetail
            template={template}
            currentUserId={user?.id ?? null}
            generatedTweets={generatedTweets}
            canAutoSchedule={canAutoSchedule}
            xAccounts={xAccounts.map((account: { id: string; account_role: 'founder' | 'company'; username: string }) => ({
                id: account.id,
                role: account.account_role,
                username: account.username,
            }))}
        />
    );
}
