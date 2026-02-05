/**
 * Content Planning Page (app/planning)
 * Server Component that fetches data and passes to Client Component
 */

import { getUserWorkflow } from '@/actions/planning';
import PlanningClient from '@/components/planning/planning-client';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/server';

export default async function PlanningPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const workflow = await getUserWorkflow();

    return <PlanningClient initialWorkflow={workflow} />;
}
