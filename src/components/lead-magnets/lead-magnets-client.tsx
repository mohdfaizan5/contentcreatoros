'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Magnet, Plus, Trash, Users, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { deleteMagnet, exportLeadsCsv } from '@/actions/lead-magnets';
import type { LeadMagnetWithLeads } from '@/types/database';

interface LeadMagnetsClientProps {
    magnets: LeadMagnetWithLeads[];
}

export function LeadMagnetsClient({ magnets }: LeadMagnetsClientProps) {
    const totalLeads = magnets.reduce((acc, m) => acc + (m.lead_count || 0), 0);
    const activeMagnets = magnets.filter(m => m.is_active).length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <Magnet className="h-5 w-5 text-rose-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Lead Magnets</h1>
                        <p className="text-muted-foreground text-sm">
                            Create landing pages to collect emails
                        </p>
                    </div>
                </div>
                <Link href="/app/lead-magnets/create">
                    <Button className="gap-2 rounded-xl transition-all duration-200 hover:scale-105">
                        <Plus className="h-4 w-4" weight="bold" />
                        Create Lead Magnet
                    </Button>
                </Link>
            </div>

            {/* Stats pills */}
            {magnets.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-sm text-rose-600">
                        <Magnet className="h-4 w-4" weight="fill" />
                        <span className="font-medium">{magnets.length}</span>
                        <span className="text-muted-foreground">magnets</span>
                    </div>
                    {activeMagnets > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-sm text-green-600">
                            <span className="font-medium">{activeMagnets}</span>
                            <span className="text-muted-foreground">active</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-sm text-blue-600">
                        <Users className="h-4 w-4" weight="fill" />
                        <span className="font-medium">{totalLeads}</span>
                        <span className="text-muted-foreground">total leads</span>
                    </div>
                </div>
            )}

            {/* Masonry Grid */}
            <MagnetsMasonryGrid magnets={magnets} />
        </div>
    );
}

function MagnetCard({ magnet }: { magnet: LeadMagnetWithLeads }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm('Delete this lead magnet and all collected leads?')) return;
        startTransition(async () => {
            await deleteMagnet(magnet.id);
        });
    };

    const handleExport = () => {
        startTransition(async () => {
            const csv = await exportLeadsCsv(magnet.id);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads-${magnet.slug}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-rose-500/30">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                    <h3 className="font-semibold truncate">{magnet.title}</h3>
                    <a
                        href={`/m/${magnet.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                    >
                        /m/{magnet.slug}
                    </a>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={handleExport} disabled={isPending} title="Export CSV">
                        <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {magnet.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{magnet.description}</p>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{magnet.lead_count || 0}</span>
                    <span className="text-muted-foreground">leads</span>
                </div>

                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${magnet.is_active
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-gray-500/10 text-gray-600'
                    }`}>
                    {magnet.delivery_type}
                </span>
            </div>
        </div>
    );
}

function MagnetsMasonryGrid({ magnets }: { magnets: LeadMagnetWithLeads[] }) {
    if (magnets.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed bg-muted/20">
                <Magnet className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
                <h3 className="font-semibold text-muted-foreground">No lead magnets yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                    Create a lead magnet to start collecting emails
                </p>
                <Link href="/app/lead-magnets/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Lead Magnet
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div
            className="columns-1 md:columns-2 lg:columns-3 gap-4"
            style={{ columnFill: 'balance' }}
        >
            {magnets.map((magnet) => (
                <div key={magnet.id} className="mb-4 break-inside-avoid">
                    <MagnetCard magnet={magnet} />
                </div>
            ))}
        </div>
    );
}
