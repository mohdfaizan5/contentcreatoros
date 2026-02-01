'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { LinkSimple, Plus, Trash, Eye, EyeSlash, DotsSixVertical, Check, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { claimUsername, updateProfile, createLink, updateLink, deleteLink, toggleLink } from '@/actions/links';
import type { LinkProfileWithLinks, Link as LinkType } from '@/types/database';

interface LinksClientProps {
    profile: LinkProfileWithLinks | null;
}

export function LinksClient({ profile }: LinksClientProps) {
    const [showLinkForm, setShowLinkForm] = useState(false);

    if (!profile) {
        return <ClaimUsername />;
    }

    const activeLinks = (profile.links || []).filter(l => l.is_active).length;
    const totalLinks = (profile.links || []).length;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="animate-fade-in-up flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                        <LinkSimple className="h-5 w-5 text-sky-500" weight="duotone" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Links</h1>
                        <p className="text-muted-foreground text-sm">
                            Your public profile:{' '}
                            <Link href={`/profile/${profile.username}`} target="_blank" className="text-primary hover:underline font-medium">
                                /{profile.username}
                            </Link>
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowLinkForm(true)}
                    className="gap-2 rounded-xl transition-all duration-200 hover:scale-105"
                >
                    <Plus className="h-4 w-4" weight="bold" />
                    Add Link
                </Button>
            </div>

            {/* Stats */}
            {totalLinks > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-4 text-center">
                        <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">{activeLinks}</div>
                        <div className="text-sm text-muted-foreground">Active Links</div>
                    </div>
                    <div className="rounded-xl bg-gray-500/5 border border-gray-500/10 p-4 text-center">
                        <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{totalLinks - activeLinks}</div>
                        <div className="text-sm text-muted-foreground">Hidden</div>
                    </div>
                </div>
            )}

            <ProfileEditor profile={profile} />

            {showLinkForm && (
                <div className="animate-fade-in-up">
                    <LinkForm profileId={profile.id} onClose={() => setShowLinkForm(false)} />
                </div>
            )}

            <LinksList links={profile.links || []} />
        </div>
    );
}

function ClaimUsername() {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!username.trim()) return;
        setError('');
        startTransition(async () => {
            try {
                await claimUsername({
                    username: username.trim().toLowerCase(),
                    display_name: displayName.trim() || null,
                });
            } catch (e: any) {
                setError(e.message || 'Failed to claim username');
            }
        });
    };

    return (
        <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
                <LinkSimple className="h-12 w-12 mx-auto text-sky-500 mb-4" weight="duotone" />
                <h1 className="text-2xl font-bold">Claim Your Username</h1>
                <p className="text-muted-foreground mt-2">
                    Create your public links page
                </p>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-4">
                <div>
                    <label className="text-sm font-medium mb-2 block">Username</label>
                    <div className="flex items-center">
                        <span className="text-muted-foreground mr-1">contentcreator.app/</span>
                        <input
                            type="text"
                            placeholder="yourname"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                            className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Display Name</label>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button onClick={handleSubmit} disabled={!username.trim() || isPending} className="w-full">
                    {isPending ? 'Claiming...' : 'Claim Username'}
                </Button>
            </div>
        </div>
    );
}

function ProfileEditor({ profile }: { profile: LinkProfileWithLinks }) {
    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updateProfile({
                display_name: displayName.trim() || null,
                bio: bio.trim() || null,
            });
            setIsEditing(false);
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Profile</h2>
                {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}><X className="h-4 w-4" /></Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending}><Check className="h-4 w-4" /></Button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <textarea
                        placeholder="Bio (optional)"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </div>
            ) : (
                <div>
                    <p className="font-medium">{profile.display_name || profile.username}</p>
                    {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
                </div>
            )}
        </div>
    );
}

function LinkForm({ profileId, onClose }: { profileId: string; onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        if (!title.trim() || !url.trim()) return;
        startTransition(async () => {
            await createLink({
                profile_id: profileId,
                title: title.trim(),
                url: url.trim(),
            });
            onClose();
        });
    };

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Add Link</h3>
            <input
                type="text"
                placeholder="Link Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!title.trim() || !url.trim() || isPending} className="flex-1">
                    {isPending ? 'Adding...' : 'Add Link'}
                </Button>
            </div>
        </div>
    );
}

function LinksList({ links }: { links: LinkType[] }) {
    if (links.length === 0) {
        return (
            <div className="text-center py-8 rounded-xl border border-dashed">
                <LinkSimple className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No links yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {links.map((link) => (
                <LinkItem key={link.id} link={link} />
            ))}
        </div>
    );
}

function LinkItem({ link }: { link: LinkType }) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            await toggleLink(link.id);
        });
    };

    const handleDelete = () => {
        if (!confirm('Delete this link?')) return;
        startTransition(async () => {
            await deleteLink(link.id);
        });
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-lg border bg-card transition-all ${!link.is_active ? 'opacity-50' : ''}`}>
            <DotsSixVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.title}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
            </div>

            <Button variant="ghost" size="icon-sm" onClick={handleToggle} disabled={isPending}>
                {link.is_active ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
                <Trash className="h-4 w-4" />
            </Button>
        </div>
    );
}
