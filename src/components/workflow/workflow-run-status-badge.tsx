import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SevenDayPlanningRunStatus } from '@/types/database';

const STATUS_LABELS: Record<SevenDayPlanningRunStatus, string> = {
  cancelled: 'Cancelled',
  failed: 'Failed',
  generating: 'Generating',
  pending_approval: 'Pending Approval',
  queued: 'Queued',
  scheduled: 'Scheduled',
};

const STATUS_CLASSNAMES: Record<SevenDayPlanningRunStatus, string> = {
  cancelled: 'border-slate-300 text-slate-600',
  failed: 'border-rose-300 bg-rose-50 text-rose-700',
  generating: 'border-sky-300 bg-sky-50 text-sky-700',
  pending_approval: 'border-amber-300 bg-amber-50 text-amber-700',
  queued: 'border-violet-300 bg-violet-50 text-violet-700',
  scheduled: 'border-emerald-300 bg-emerald-50 text-emerald-700',
};

export function WorkflowRunStatusBadge({
  status,
  className,
}: {
  status: SevenDayPlanningRunStatus;
  className?: string;
}) {
  return (
    <Badge
      className={cn('border', STATUS_CLASSNAMES[status], className)}
      variant="outline"
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
