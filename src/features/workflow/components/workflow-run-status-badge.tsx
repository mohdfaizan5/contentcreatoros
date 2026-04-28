import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { SevenDayPlanningRunStatus } from '@/shared/types/database';

const STATUS_LABELS: Record<SevenDayPlanningRunStatus, string> = {
  cancelled: 'Cancelled',
  failed: 'Failed',
  generating: 'Generating',
  pending_approval: 'Pending Approval',
  queued: 'Queued',
  scheduled: 'Scheduled',
};

const STATUS_CLASSNAMES: Record<SevenDayPlanningRunStatus, string> = {
  cancelled: 'border-border/50 text-slate-600',
  failed: 'bg-rose-50 text-rose-700',
  generating: 'bg-sky-50 text-sky-700',
  pending_approval: 'bg-amber-50 text-amber-700',
  queued: 'bg-violet-50 text-violet-700',
  scheduled: 'bg-emerald-50 text-emerald-700',
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
