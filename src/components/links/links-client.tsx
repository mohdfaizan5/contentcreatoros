'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    LinkSimple, Plus, Trash, Eye, EyeSlash, DotsSixVertical, Check, X,
    Palette, Image as ImageIcon, PencilSimple, ArrowSquareOut, Upload, User, ChartLine
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { claimUsername, updateProfile, createLink, deleteLink, toggleLink, reorderLinks, uploadProfileLogo } from '@/actions/links';
import { profileTemplates, getTemplate, getCardBorderRadius } from '@/lib/profile-templates';
import { getPlatformInfo, detectPlatform } from '@/lib/link-utils';
import type { LinkProfileWithLinks, Link as LinkType } from '@/types/database';
import { ProfilePreviewCard } from './profile-preview';
import { ProfileViewsAnalytics } from '../analytics/link-analytics';

interface LinksClientProps {
    profile: LinkProfileWithLinks | null;
}

// ... imports
// (Keep existing imports)

export function LinksClient({ profile }: LinksClientProps) {
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'links' | 'branding' | 'analytics'>('links');

    if (!profile) {
        return <ClaimUsername />;
    }

    const totalLinks = (profile.links || []).length;

    return (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN - Editor & Tabs */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                                <LinkSimple className="h-5 w-5 text-sky-500" weight="duotone" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Public Page</h1>
                                <p className="text-muted-foreground text-sm flex items-center gap-1">
                                    Manage your creative profile
                                </p>
                            </div>
                        </div>
                        <Link href={`/profile/${profile.username}`} target="_blank" className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                            /{profile.username}
                            <ArrowSquareOut className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border w-fit">
                        <button
                            onClick={() => setActiveTab('links')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'links'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <LinkSimple className="h-4 w-4" weight={activeTab === 'links' ? 'fill' : 'duotone'} />
                            Links
                        </button>
                        <button
                            onClick={() => setActiveTab('branding')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'branding'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <Palette className="h-4 w-4" weight={activeTab === 'branding' ? 'fill' : 'duotone'} />
                            Appearance
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'analytics'
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <ChartLine className="h-4 w-4" weight={activeTab === 'analytics' ? 'fill' : 'duotone'} />
                            Analytics
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'links' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Add Link Button Section */}
                                <div className="flex flex-col gap-4">
                                    {!showLinkForm ? (
                                        <Button
                                            onClick={() => setShowLinkForm(true)}
                                            className="w-full py-6 text-base shadow-sm rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground hover:bg-muted/10 hover:border-primary/50 hover:text-primary transition-all custom-dashed-button"
                                            variant="ghost"
                                        >
                                            <Plus className="h-5 w-5 mr-2" weight="bold" />
                                            Add New Link
                                        </Button>
                                    ) : (
                                        <div className="animate-fade-in-up">
                                            <LinkForm profileId={profile.id} onClose={() => setShowLinkForm(false)} />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-sm font-medium text-muted-foreground">Your Links ({totalLinks})</h3>
                                    </div>
                                    <LinksList links={profile.links || []} profileId={profile.id} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'branding' && (
                            <div className="animate-fade-in">
                                <ProfileEditor profile={profile} />
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="animate-fade-in">
                                <ProfileViewsAnalytics />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN - Preview */}
                <div className="lg:col-span-5 relative hidden lg:block h-full">
                    <div className="sticky top-24 self-start">
                        <div className="bg-muted/30 rounded-3xl p-4 border border-muted/50">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Live Preview
                                </h3>
                                <div className="flex gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-400/50" />
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/50" />
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-2xl border bg-background shadow-lg shadow-black/5">
                                <ProfilePreviewCard profile={profile} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                <p className="text-muted-foreground mt-2">Create your public links page</p>
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

// Compact profile card with inline editing
function ProfileCard({ profile }: { profile: LinkProfileWithLinks }) {
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [tagline, setTagline] = useState(profile.tagline || '');
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updateProfile({
                display_name: displayName.trim() || null,
                bio: bio.trim() || null,
                tagline: tagline.trim() || null,
            });
            setIsEditing(false);
        });
    };

    if (isEditing) {
        return (
            <div className="rounded-xl border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Edit Profile</h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending}>
                            <Check className="h-4 w-4 mr-1" />
                            Save
                        </Button>
                    </div>
                </div>
                <div className="grid gap-3">
                    <input
                        type="text"
                        placeholder="Display Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                        type="text"
                        placeholder="Tagline (e.g., Content Creator & Developer)"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        maxLength={100}
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
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                {profile.logo_url || profile.avatar_url ? (
                    <img
                        src={profile.logo_url || profile.avatar_url!}
                        alt={profile.display_name || profile.username}
                        className="w-14 h-14 rounded-xl object-cover border"
                    />
                ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                        {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{profile.display_name || profile.username}</h3>
                    {profile.tagline && (
                        <p className="text-sm text-muted-foreground truncate">{profile.tagline}</p>
                    )}
                    {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>
                    )}
                </div>

                {/* Edit Button */}
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <PencilSimple className="h-4 w-4 mr-1" />
                    Edit
                </Button>
            </div>
        </div>
    );
}

function ProfileEditor({ profile }: { profile: LinkProfileWithLinks }) {
    const [username, setUsername] = useState(profile.username);
    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [tagline, setTagline] = useState(profile.tagline || '');
    const [bio, setBio] = useState(profile.bio || '');
    const [selectedTemplate, setSelectedTemplate] = useState(profile.template_id || 'minimal-light');
    const [accentColor, setAccentColor] = useState(profile.accent_color || '');
    const [isPending, startTransition] = useTransition();
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [usernameChanged, setUsernameChanged] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);
            await uploadProfileLogo(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to upload logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateProfile({
                username: username.trim().toLowerCase() !== profile.username ? username.trim().toLowerCase() : undefined,
                display_name: displayName.trim() || null,
                tagline: tagline.trim() || null,
                bio: bio.trim() || null,
                template_id: selectedTemplate,
                accent_color: accentColor.trim() || null,
            });
            setSaved(true);
            setUsernameChanged(false);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const handleUsernameChange = (value: string) => {
        const sanitized = value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
        setUsername(sanitized);
        if (sanitized !== profile.username) {
            setUsernameChanged(true);
        } else {
            setUsernameChanged(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Information */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <User className="h-5 w-5 text-muted-foreground" weight="duotone" />
                    <h2 className="font-semibold">Profile Information</h2>
                </div>

                {/* Username with Warning */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Username</label>
                    <div className="flex items-center">
                        <span className="text-muted-foreground mr-1 text-sm">contentcreator.app/</span>
                        <input
                            type="text"
                            placeholder="yourname"
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {usernameChanged && (
                        <div className="mt-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-sm text-destructive font-medium">⚠️ Warning: Changing your username</p>
                            <p className="text-xs text-destructive/80 mt-1">
                                Previously shared links (contentcreator.app/{profile.username}) will no longer work. Make sure to update any links you've shared externally.
                            </p>
                        </div>
                    )}
                </div>

                {/* Display Name */}
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

                {/* Tagline */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Tagline</label>
                    <input
                        type="text"
                        placeholder="e.g., Content Creator & Developer"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        maxLength={100}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Bio */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Bio (Optional)</label>
                    <textarea
                        placeholder="Tell people about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                </div>
            </div>

            {/* Logo Upload */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" weight="duotone" />
                    <h2 className="font-semibold">Profile Picture</h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* Preview */}
                    {profile.logo_url ? (
                        <img
                            src={profile.logo_url}
                            alt="Logo"
                            className="w-20 h-20 rounded-xl object-cover border"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                    )}

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : profile.logo_url ? 'Change' : 'Upload'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            Max 2MB • JPG, PNG, GIF, WebP
                        </p>
                    </div>
                </div>

                {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            </div>

            {/* Template Selection */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="h-5 w-5 text-muted-foreground" weight="duotone" />
                    <h2 className="font-semibold">Theme</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {profileTemplates.map((template) => (
                        <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-muted hover:border-muted-foreground/30'
                                }`}
                        >
                            {/* Preview */}
                            <div
                                className="h-20 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
                                style={{ background: template.preview.background }}
                            >
                                <div
                                    className="w-3/4 py-2 px-3 text-xs font-medium"
                                    style={{
                                        background: template.preview.cardBg,
                                        border: `1px solid ${template.preview.cardBorder}`,
                                        borderRadius: template.styles.cardStyle === 'sharp' ? '0' : template.styles.cardStyle === 'pill' ? '9999px' : '8px',
                                        color: template.preview.textColor,
                                    }}
                                >
                                    Example Link
                                </div>
                            </div>
                            <div className="font-medium text-sm">{template.name}</div>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                            {selectedTemplate === template.id && (
                                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-primary-foreground" weight="bold" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Accent Color */}
                <div className="pt-4 border-t">
                    <label className="text-sm font-medium mb-2 block">Accent Color (Optional)</label>
                    <div className="flex gap-3 items-center">
                        <input
                            type="color"
                            value={accentColor || '#3b82f6'}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="w-10 h-10 rounded-lg border cursor-pointer"
                        />
                        <input
                            type="text"
                            placeholder="#3b82f6"
                            value={accentColor}
                            onChange={(e) => setAccentColor(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                        />
                        {accentColor && (
                            <Button variant="ghost" size="sm" onClick={() => setAccentColor('')}>
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isPending} className="w-full gap-2">
                {isPending ? 'Saving...' : saved ? (
                    <>
                        <Check className="h-4 w-4" />
                        Saved!
                    </>
                ) : 'Save Changes'}
            </Button>
        </div>
    );
}

function LinkForm({ profileId, onClose }: { profileId: string; onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (url.trim()) {
            const platform = detectPlatform(url);
            setDetectedPlatform(platform);
        } else {
            setDetectedPlatform(null);
        }
    }, [url]);

    const handleSubmit = () => {
        if (!title.trim() || !url.trim()) return;
        startTransition(async () => {
            await createLink({
                profile_id: profileId,
                title: title.trim(),
                url: url.trim(),
                icon: detectedPlatform || null,
            });
            onClose();
        });
    };

    const platformInfo = detectedPlatform ? getPlatformInfo(detectedPlatform) : null;
    const PlatformIcon = platformInfo?.icon;

    return (
        <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Add Link</h3>

            <div>
                <label className="text-sm font-medium mb-2 block">URL</label>
                <div className="relative">
                    <input
                        type="url"
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    />
                    {PlatformIcon && (
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${platformInfo?.color}`}>
                            <PlatformIcon className="h-5 w-5" weight="fill" />
                        </div>
                    )}
                </div>
                {platformInfo && platformInfo.id !== 'website' && platformInfo.id !== 'default' && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" />
                        Detected: {platformInfo.name}
                    </p>
                )}
            </div>

            <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <input
                    type="text"
                    placeholder="Link Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!title.trim() || !url.trim() || isPending} className="flex-1">
                    {isPending ? 'Adding...' : 'Add Link'}
                </Button>
            </div>
        </div>
    );
}

function LinksList({ links, profileId }: { links: LinkType[]; profileId: string }) {
    const [orderedLinks, setOrderedLinks] = useState(links);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setOrderedLinks(links);
    }, [links]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newLinks = [...orderedLinks];
        const draggedItem = newLinks[draggedIndex];
        newLinks.splice(draggedIndex, 1);
        newLinks.splice(index, 0, draggedItem);
        setOrderedLinks(newLinks);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null) {
            // Save new order
            startTransition(async () => {
                await reorderLinks(profileId, orderedLinks.map(l => l.id));
            });
        }
        setDraggedIndex(null);
    };

    if (orderedLinks.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed">
                <LinkSimple className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No links yet</p>
                <p className="text-sm text-muted-foreground/70">Add your first link above</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {orderedLinks.map((link, index) => (
                <LinkItem
                    key={link.id}
                    link={link}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                />
            ))}
        </div>
    );
}

interface LinkItemProps {
    link: LinkType;
    index: number;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
}

function LinkItem({ link, index, onDragStart, onDragOver, onDragEnd, isDragging }: LinkItemProps) {
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

    const platformInfo = getPlatformInfo(link.icon || link.url);
    const PlatformIcon = platformInfo.icon;

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={`group relative flex items-center gap-3 p-4 rounded-xl border bg-card transition-all hover:shadow-md ${!link.is_active ? 'opacity-50' : ''
                } ${isDragging ? 'opacity-70 scale-[1.02] shadow-lg' : ''}`}
        >
            <DotsSixVertical className="h-5 w-5 text-muted-foreground cursor-grab shrink-0" />

            {/* Platform Icon */}
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${platformInfo.bgColor} border ${platformInfo.borderColor}`}>
                <PlatformIcon className={`h-5 w-5 ${platformInfo.color}`} weight="fill" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.title}</p>
                <p className="text-sm text-muted-foreground truncate">{link.url}</p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon-sm" onClick={handleToggle} disabled={isPending}>
                    {link.is_active ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
                </Button>

                <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive">
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
