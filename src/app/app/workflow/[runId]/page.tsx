import { notFound } from 'next/navigation';

import { getWorkflowPlannerRun } from '@/actions/workflow-planner';
import WorkflowRunDetailClient from '@/components/workflow/workflow-run-detail-client';
import { getImagesPageData } from '@/lib/images-page-data';

type WorkflowRunPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function WorkflowRunPage({ params }: WorkflowRunPageProps) {
  const { runId } = await params;
  const [details, imageStudioContext] = await Promise.all([
    getWorkflowPlannerRun(runId),
    getImagesPageData(),
  ]);

  if (!details) {
    notFound();
  }

  return (
    <WorkflowRunDetailClient
      imageStudioContext={imageStudioContext}
      items={details.items}
      run={details.run}
      xProfile={details.xProfile}
    />
  );
}
