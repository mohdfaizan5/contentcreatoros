import { notFound } from 'next/navigation';

import { getAutoEngageRunDetail } from '@/features/auto-engage/actions/auto-engage';
import { AutoEngageRunDetail } from '@/features/auto-engage/components/auto-engage-run-detail';

type AutoEngageRunPageProps = {
  params: Promise<{ runId: string }>;
};

export default async function AutoEngageRunPage({ params }: AutoEngageRunPageProps) {
  const { runId } = await params;
  const details = await getAutoEngageRunDetail(runId);

  if (!details) {
    notFound();
  }

  return (
    <AutoEngageRunDetail
      account={details.account}
      createdAt={details.run.created_at}
      pageError={details.pageError}
      runId={details.run.id}
      suggestions={details.suggestions}
    />
  );
}
