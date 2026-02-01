'use client';

import { useState, useTransition } from 'react';
import { Magnet, Check, ArrowRight, Download, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { captureLead } from '@/actions/lead-magnets';
import type { LeadMagnet } from '@/types/database';

interface LeadMagnetFormProps {
    magnet: LeadMagnet;
}

export function LeadMagnetForm({ magnet }: LeadMagnetFormProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        startTransition(async () => {
            await captureLead({
                magnet_id: magnet.id,
                email: email.trim(),
                name: name.trim() || null,
            });
            setIsSubmitted(true);
        });
    };

    if (isSubmitted) {
        return <SuccessState magnet={magnet} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border bg-card p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <Magnet className="h-8 w-8" weight="duotone" />
                        </div>
                        <h1 className="text-2xl font-bold">{magnet.title}</h1>
                        {magnet.description && (
                            <p className="text-muted-foreground mt-3">{magnet.description}</p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {magnet.collect_fields === 'name_and_email' && (
                            <input
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        )}

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />

                        <Button
                            type="submit"
                            className="w-full py-6 text-base"
                            disabled={!email.trim() || isPending}
                        >
                            {isPending ? 'Processing...' : 'Get Access'}
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        No spam. Unsubscribe anytime.
                    </p>
                </div>

                <div className="text-center mt-8">
                    <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Powered by Content OS
                    </a>
                </div>
            </div>
        </div>
    );
}

function SuccessState({ magnet }: { magnet: LeadMagnet }) {
    if (magnet.delivery_type === 'redirect' && magnet.delivery_url) {
        // Auto-redirect
        if (typeof window !== 'undefined') {
            window.location.href = magnet.delivery_url;
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border bg-card p-8 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto mb-6">
                        <Check className="h-8 w-8" weight="bold" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">You're in!</h1>
                    <p className="text-muted-foreground mb-6">Thanks for signing up.</p>

                    {magnet.delivery_type === 'download' && magnet.delivery_url && (
                        <a
                            href={magnet.delivery_url}
                            download
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            <Download className="h-5 w-5" />
                            Download Now
                        </a>
                    )}

                    {magnet.delivery_type === 'redirect' && magnet.delivery_url && (
                        <a
                            href={magnet.delivery_url}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            <ArrowSquareOut className="h-5 w-5" />
                            Continue
                        </a>
                    )}

                    {magnet.delivery_type === 'content' && magnet.delivery_content && (
                        <div className="mt-6 p-4 bg-muted rounded-xl text-left">
                            <p className="whitespace-pre-wrap">{magnet.delivery_content}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
