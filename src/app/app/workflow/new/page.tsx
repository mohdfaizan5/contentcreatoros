import Link from 'next/link';

import WorkflowNewRunClient from '@/features/workflow/components/workflow-new-run-client';
import { listPublishingXAccountsForCurrentUser } from '@/features/x/lib/x-auth';
import { Button } from '@/shared/components/ui/button';

export default async function NewWorkflowRunPage() {
  const xAccounts = await listPublishingXAccountsForCurrentUser();

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-4">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">New Workflow Run</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick 1-14 days, queue generation, and review all drafts from a dedicated run page.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/workflow">Back to workflow</Link>
        </Button>
      </section>

      <WorkflowNewRunClient
        xAccounts={xAccounts.map((account) => ({
          id: account.id,
          role: account.account_role,
          username: account.username,
        }))}
      />
    </div>
  );
}
