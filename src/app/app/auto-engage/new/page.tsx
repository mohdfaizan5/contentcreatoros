import type { Metadata } from 'next';

import { getAutoEngagePageData } from '@/features/auto-engage/actions/auto-engage';
import { AutoEngageWorkbench } from '@/features/auto-engage/components/auto-engage-workbench';

export const metadata: Metadata = {
  title: 'New Auto Engage Run | ContentOSX',
  description:
    'Generate a fresh Auto Engage run with manual reply drafts for today’s best opportunities.',
};

export default async function AutoEngageNewPage() {
  const data = await getAutoEngagePageData();

  return <AutoEngageWorkbench {...data} />;
}
