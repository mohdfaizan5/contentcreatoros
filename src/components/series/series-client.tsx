'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { SeriesForm, SeriesList } from './series-components';
import type { SeriesWithIdeas } from '@/types/database';

interface SeriesClientProps {
    seriesList: SeriesWithIdeas[];
}

export function SeriesClient({ seriesList }: SeriesClientProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Series</h1>
                    <p className="text-muted-foreground">
                        Think in systems, not random posts. Track your content series.
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Series
                </Button>
            </div>

            {showForm && <SeriesForm onClose={() => setShowForm(false)} />}

            <SeriesList seriesList={seriesList} />
        </div>
    );
}
