'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { TemplateForm } from './template-form';
import { TemplatesGrid } from './template-card';
import type { Template } from '@/types/database';

interface TemplatesClientProps {
    templates: Template[];
}

export function TemplatesClient({ templates }: TemplatesClientProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
                    <p className="text-muted-foreground">
                        Thinking scaffolds to structure your content creation.
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {showForm && (
                <TemplateForm onClose={() => setShowForm(false)} />
            )}

            <TemplatesGrid templates={templates} />
        </div>
    );
}
