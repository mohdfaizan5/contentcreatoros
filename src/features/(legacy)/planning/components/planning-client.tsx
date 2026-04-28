/**
 * Planning Client Component
 * Handles the client-side logic for onboarding and kanban board
 */

'use client';

import { useState } from 'react';

import type { UserWorkflow } from '@/features/(legacy)/planning/types/planning';
import OnboardingDialog from './onboarding-dialog';
import KanbanBoard from './kanban-board';

interface PlanningClientProps {
    initialWorkflow: UserWorkflow | null;
}

export default function PlanningClient({ initialWorkflow }: PlanningClientProps) {
    const [workflow, setWorkflow] = useState(initialWorkflow);
    const needsOnboarding = !workflow;

    const handleOnboardingComplete = () => {
        // Reload to fetch the newly created workflow
        window.location.reload();
    };

    const handleWorkflowUpdate = () => {
        // Reload to fetch the updated workflow
        window.location.reload();
    };

    if (needsOnboarding) {
        return (
            <>
                <div className="max-w-4xl mx-auto text-center py-20">
                    <h1 className="text-4xl font-bold mb-4">Content Planning</h1>
                    <p className="text-xl text-muted-foreground">
                        Let's set up your workflow first
                    </p>
                </div>
                <OnboardingDialog
                    open={true}
                    onComplete={handleOnboardingComplete}
                />
            </>
        );
    }

    return <KanbanBoard workflow={workflow} onWorkflowUpdate={handleWorkflowUpdate} />;
}
