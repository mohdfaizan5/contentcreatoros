'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { InspirationForm, InspirationList } from './inspiration-components';
import type { Inspiration } from '@/types/database';

interface InspirationClientProps {
    inspirations: Inspiration[];
}

export function InspirationClient({ inspirations }: InspirationClientProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inspiration</h1>
                    <p className="text-muted-foreground">
                        Collect and reference content that inspires you.
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Inspiration
                </Button>
            </div>

            {showForm && <InspirationForm onClose={() => setShowForm(false)} />}

            <InspirationList inspirations={inspirations} />
        </div>
    );
}
