'use client';

import { useState, useRef, useEffect } from 'react';
import { PencilSimple, ArrowsClockwise, ArrowSquareOut } from '@phosphor-icons/react';
import type { LinkProfileWithLinks } from '@/types/database';
import { Button } from '@/components/ui/button';

interface ProfilePreviewCardProps {
    profile: LinkProfileWithLinks;
    onEditClick?: () => void;
}

export function ProfilePreviewCard({ profile, onEditClick }: ProfilePreviewCardProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Refresh iframe when profile basic details change heavily, but normally standard Save updates DB which iframe fetches.
    // We might need a manual refresh button.

    const handleRefresh = () => {
        setLoading(true);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="flex flex-col h-[600px] w-full bg-muted/5 relative group">
            {/* Toolbar */}
            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-sm bg-background/80 backdrop-blur-sm"
                    onClick={handleRefresh}
                    title="Refresh Preview"
                >
                    <ArrowsClockwise className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <a
                    href={`/profile/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 flex items-center justify-center rounded-full shadow-sm bg-background/80 backdrop-blur-sm hover:bg-background transition-colors text-foreground"
                    title="Open Live Page"
                >
                    <ArrowSquareOut className="h-4 w-4" />
                </a>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 w-full h-full overflow-hidden bg-background">
                <iframe
                    key={refreshKey}
                    ref={iframeRef}
                    src={`/profile/${profile.username}`}
                    className="w-full h-full border-none"
                    title="Profile Preview"
                    onLoad={() => setLoading(false)}
                />
            </div>

            {/* Interaction Blocker (optional, to prevent clicking links in preview) */}
            {/* <div className="absolute inset-0 z-0 pointer-events-none" /> */}
        </div>
    );
}
