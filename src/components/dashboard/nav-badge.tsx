'use client';

import { Badge } from '@/components/ui/badge';

interface NavBadgeProps {
    isNew?: boolean;
    isUpdated?: boolean;
}

export function NavBadge({ isNew, isUpdated }: NavBadgeProps) {
    if (isNew) {
        return (
            <Badge
                variant="default"
                className="ml-2 h-5 px-1.5 text-[10px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            >
                NEW
            </Badge>
        );
    }

    if (isUpdated) {
        return (
            <Badge
                variant="secondary"
                className="ml-2 h-5 px-1.5 text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30"
            >
                UPDATED
            </Badge>
        );
    }

    return null;
}
