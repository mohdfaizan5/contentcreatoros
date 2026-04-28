import { notFound } from 'next/navigation';

import { getWorkflowPlannerRun } from '@/features/workflow/actions/workflow-planner';
import WorkflowRunDetailClient from '@/features/workflow/components/workflow-run-detail-client';
import { getImagesPageData } from '@/features/image-studio/lib/images-page-data';

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

