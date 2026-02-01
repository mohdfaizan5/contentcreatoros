'use client';

import { useState, useTransition } from 'react';
import { Magnet, Plus, Trash, Eye, EyeSlash, Users, Download } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { createMagnet, deleteMagnet, exportLeadsCsv } from '@/actions/lead-magnets';
import type { LeadMagnetWithLeads, DeliveryType, CollectFields } from '@/types/database';

interface LeadMagnetsClientProps {
    magnets: LeadMagnetWithLeads[];
}

export function LeadMagnetsClient({ magnets }: LeadMagnetsClientProps) {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lead Magnets</h1>
                    <p className="text-muted-foreground">
                        Create landing pages to collect emails in exchange for content.
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lead Magnet
                </Button>
            </div>

            {showForm && <MagnetForm onClose={() => setShowForm(false)} />}

            <MagnetsList magnets={magnets} />
        </div>
    );
}

function MagnetForm({ onClose }: { onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [deliveryType, setDeliveryType] = useState<DeliveryType>('download');
    const [deliveryUrl, setDeliveryUrl] = useState('');
    const [deliveryContent, setDeliveryContent] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!title.trim() || !slug.trim()) return;
        startTransition(async () => {
            await createMagnet({
                title: title.trim(),
                slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                description: description.trim() || null,
                delivery_type: deliveryType,
                delivery_url: deliveryUrl.trim() || null,
                delivery_content: deliveryContent.trim() || null,
            });
            onClose();
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Create Lead Magnet</h3>

            <input
                type="text"
                placeholder="Title (e.g., Free Startup Glossary)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL slug</label>
                <div className="flex items-center">
                    <span className="text-muted-foreground mr-1">/m/</span>
                    <input
                        type="text"
                        placeholder="startup-glossary"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                        className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <textarea
                placeholder="Description (shown on landing page)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />

            <div>
                <label className="text-sm font-medium mb-2 block">Delivery Type</label>
                <div className="flex gap-2">
                    {(['download', 'redirect', 'content'] as DeliveryType[]).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setDeliveryType(type)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${deliveryType === type ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {(deliveryType === 'download' || deliveryType === 'redirect') && (
                <input
                    type="url"
                    placeholder={deliveryType === 'download' ? 'Download URL (file link)' : 'Redirect URL'}
                    value={deliveryUrl}
                    onChange={(e) => setDeliveryUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
            )}

            {deliveryType === 'content' && (
                <textarea
                    placeholder="Content to show after submission..."
                    value={deliveryContent}
                    onChange={(e) => setDeliveryContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            )}

            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!title.trim() || !slug.trim() || isPending} className="flex-1">
                    {isPending ? 'Creating...' : 'Create'}
                </Button>
            </div>
        </div>
    );
}

function MagnetsList({ magnets }: { magnets: LeadMagnetWithLeads[] }) {
    if (magnets.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <Magnet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No lead magnets yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Create a lead magnet to start collecting emails
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {magnets.map((magnet) => (
                <MagnetCard key={magnet.id} magnet={magnet} />
            ))}
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
        <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="font-semibold">{magnet.title}</h3>
                    <a
                        href={`/m/${magnet.slug}`}
                        target="_blank"
                        className="text-sm text-primary hover:underline"
                    >
                        /m/{magnet.slug}
                    </a>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={handleExport} disabled={isPending} title="Export CSV">
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {magnet.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{magnet.description}</p>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
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
