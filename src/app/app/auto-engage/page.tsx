import Link from 'next/link';
import type { Metadata } from 'next';
import { format, parseISO } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr';

import { listAutoEngageRuns } from '@/features/auto-engage/actions/auto-engage';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

export const metadata: Metadata = {
  title: 'Auto Engage | ContentOSX',
  description:
    'Review Auto Engage runs, open past queues, and generate new manual reply drafts safely.',
};

export default async function AutoEngagePage() {
  const { pageError, runs } = await listAutoEngageRuns({ limit: 36 });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Auto Engage</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Each run captures a batch of hand-picked engagement opportunities.
          </p>
        </div>

        <Button asChild className="flex gap-2">
          <Link href="/app/auto-engage/new">
            New run
            <PlusIcon size={26} />
          </Link>
        </Button>
      </section>

      {pageError ? (
        <Alert variant="warning">
          <AlertTitle>Auto Engage needs attention</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      ) : null}

      {runs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <p className="text-sm text-muted-foreground">
              No Auto Engage runs yet. Create your first run to generate draft replies.
            </p>
            <Button asChild>
              <Link href="/app/auto-engage/new">Create your first run</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {run.x_account_role === 'company' ? 'Company' : 'Founder'} @{run.x_account_username}
                    </CardTitle>
                    <CardDescription>
                      <span className="mr-1 font-medium">Created</span>
                      {format(parseISO(run.created_at), 'MMM d, yyyy h:mm a')}
                      {run.profile_name ? (
                        <span className="ml-2 text-xs text-muted-foreground">{run.profile_name}</span>
                      ) : null}
                    </CardDescription>
                  </div>
                  <Button asChild className="group gap-2" variant="outline">
                    <Link href={`/app/auto-engage/${run.id}`}>
                      Open run
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:-rotate-45" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{run.counts.total} drafts</Badge>
                  <Badge variant="outline">{run.counts.copied} copied</Badge>
                  <Badge variant="outline">{run.counts.posted} posted</Badge>
                  <Badge variant="outline">{run.counts.skipped} skipped</Badge>
                  <Badge variant="outline">{run.counts.pending} pending</Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
