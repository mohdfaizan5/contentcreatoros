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
            campaignMetrics={details.campaignMetrics}
            generatedTweetStatusById={details.generatedTweetStatusById}
            imageStudioContext={imageStudioContext}
            itemDeliveryStatusByItemId={details.itemDeliveryStatusByItemId}
            items={details.items}
            run={details.run}
            xProfile={details.xProfile}
        />
  );
}
