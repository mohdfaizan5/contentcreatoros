import Link from 'next/link';

import WorkflowNewRunClient from '@/features/workflow/components/workflow-new-run-client';
import { listPublishingXAccountsForCurrentUser, ensureStoredXAccessToken } from '@/features/x/lib/x-auth';
import { getAuthenticatedXUser } from '@/features/x/lib/x';
import { Button } from '@/shared/components/ui/button';

export default async function NewWorkflowRunPage() {
  const xAccounts = await listPublishingXAccountsForCurrentUser();
  const enrichedAccounts = await Promise.all(
    xAccounts.map(async (account) => {
      try {
        const accessToken = await ensureStoredXAccessToken(account.id);
        const profile = await getAuthenticatedXUser(accessToken);

        return {
          avatarUrl: profile.profile_image_url ?? null,
          id: account.id,
          name: profile.name || account.username,
          role: account.account_role,
          username: profile.username || account.username,
        };
      } catch {
        return {
          avatarUrl: null,
          id: account.id,
          name: account.username,
          role: account.account_role,
          username: account.username,
        };
      }
    }),
  );

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
        xAccounts={enrichedAccounts}
      />
    </div>
  );
}
