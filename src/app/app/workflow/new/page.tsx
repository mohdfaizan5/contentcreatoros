import Link from 'next/link';

import WorkflowNewRunClient from '@/components/workflow/workflow-new-run-client';
import { Button } from '@/components/ui/button';

export default function NewWorkflowRunPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-4">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">New Workflow Run</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick exactly 7 days, queue generation, and review all drafts from a dedicated run page.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/workflow">Back to workflow</Link>
        </Button>
      </section>

      <WorkflowNewRunClient />
    </div>
  );
}
