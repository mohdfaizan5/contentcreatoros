import { notFound } from 'next/navigation';

import { getWorkflowPlannerRun } from '@/actions/workflow-planner';
import WorkflowRunDetailClient from '@/components/workflow/workflow-run-detail-client';

type WorkflowRunPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function WorkflowRunPage({ params }: WorkflowRunPageProps) {
  const { runId } = await params;
  const details = await getWorkflowPlannerRun(runId);

  if (!details) {
    notFound();
  }

  return <WorkflowRunDetailClient items={details.items} run={details.run} />;
}
