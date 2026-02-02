'use client';

import { useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import type { LinkProfileWithLinks } from '@/types/database';

interface ProfilePreviewCardProps {
    profile: LinkProfileWithLinks;
    onEditClick: () => void;
}

export function ProfilePreviewCard({ profile, onEditClick }: ProfilePreviewCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="relative rounded-xl border bg-card p-6 transition-all hover:shadow-md"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-start gap-4">
                {/* Avatar/Logo with subtle edit icon */}
                <div className="relative">
                    {profile.logo_url || profile.avatar_url ? (
                        <img
                            src={profile.logo_url || profile.avatar_url!}
                            alt={profile.display_name || profile.username}
                            className="w-16 h-16 rounded-xl object-cover border"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                            {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Subtle edit icon on image */}
                    {isHovered && (
                        <button
                            onClick={onEditClick}
                            className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
                        >
                            <PencilSimple className="h-3.5 w-3.5" weight="bold" />
                        </button>
                    )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h3 className="font-semibold text-lg truncate">
                                {profile.display_name || profile.username}
                            </h3>
                            {profile.tagline && (
                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                    {profile.tagline}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {profile.bio}
                        </p>
                    )}

                    {/* Link count */}
                    <p className="text-xs text-muted-foreground mt-3">
                        {(profile.links || []).filter(l => l.is_active).length} active link{(profile.links || []).filter(l => l.is_active).length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
}
