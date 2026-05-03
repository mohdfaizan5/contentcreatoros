'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteWorkflowPlannerRun } from '@/features/workflow/actions/workflow-planner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogPopup,
    AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export function WorkflowRunCardMenu({
    runId,
    rangeLabel,
}: {
    runId: string;
    rangeLabel: string;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteWorkflowPlannerRun(runId);
                toast.success('Campaign deleted.');
                setIsDeleteOpen(false);
                router.refresh();
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Unable to delete this campaign.',
                );
            }
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        aria-label="Open campaign menu"
                        className="rounded-full"
                        size="icon"
                        variant="outline"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete campaign
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen}>
                <AlertDialogPopup size="sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the workflow run, its generated items, and any scheduled local posts for {rangeLabel}.
                            Already published posts on X will stay live.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isPending}
                            onClick={handleDelete}
                            render={
                                <Button variant="destructive">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Delete campaign
                                </Button>
                            }
                        />
                    </AlertDialogFooter>
                </AlertDialogPopup>
            </AlertDialog>
        </>
    );
}
