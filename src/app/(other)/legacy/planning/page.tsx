/**
 * Content Planning Page (app/planning)
 * Server Component that fetches data and passes to Client Component
 */

import { getUserWorkflow } from '@/features/(legacy)/planning/actions/planning';
import { redirect } from 'next/navigation';
import { createClient } from '@/shared/lib/supabase/server';
import PlanningClient from '@/features/(legacy)/planning/components/planning-client';

export default async function PlanningPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const workflow = await getUserWorkflow();

    return <PlanningClient initialWorkflow={workflow} />;
}
