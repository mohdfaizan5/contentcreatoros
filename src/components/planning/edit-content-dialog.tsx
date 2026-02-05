import {
    YoutubeLogo,
    InstagramLogo,
    TwitterLogo,
    LinkedinLogo,
    Article
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

import { useState, useEffect, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateContentCard } from '@/actions/planning';
import { getSeries } from '@/actions/series';
import { PLATFORMS, getContentTypesForPlatforms } from '@/types/planning';
import type { Series } from '@/types/database';
import type { ContentCardWithRelations } from '@/types/planning';

interface EditContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    card: ContentCardWithRelations;
}

export default function EditContentDialog({
    open,
    onOpenChange,
    onSuccess,
    card,
}: EditContentDialogProps) {
    const [title, setTitle] = useState(card.title || '');
    const [description, setDescription] = useState(card.description || '');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(card.platforms || []);
    const [contentType, setContentType] = useState<string>(card.content_type || '');
    const [selectedSeries, setSelectedSeries] = useState<string | null>(card.series_id || null);

    const [series, setSeries] = useState<Series[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasChanges, setHasChanges] = useState(false);

    // Check for changes effect
    useEffect(() => {
        const changes =
            title !== (card.title || '') ||
            description !== (card.description || '') ||
            JSON.stringify(selectedPlatforms.sort()) !== JSON.stringify((card.platforms || []).sort()) ||
            contentType !== (card.content_type || '') ||
            selectedSeries !== (card.series_id || null);
        setHasChanges(changes);
    }, [title, description, selectedPlatforms, contentType, selectedSeries, card]);

    // Load series on mount and sync state if card prop changes
    useEffect(() => {
        if (open) {
            loadData();
            setTitle(card.title || '');
            setDescription(card.description || '');
            setSelectedPlatforms(card.platforms || []);
            setContentType(card.content_type || '');
            setSelectedSeries(card.series_id || null);
        }
    }, [open, card]);

    const loadData = async () => {
        try {
            const seriesData = await getSeries();
            setSeries(seriesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    const availableContentTypes = getContentTypesForPlatforms(selectedPlatforms);

    const handleClose = (openState: boolean) => {
        if (!openState && hasChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                return;
            }
        }
        onOpenChange(openState);
    };

    const getPlatformIcon = (key: string) => {
        switch (key) {
            case 'youtube': return <YoutubeLogo weight="fill" className="w-5 h-5" />;
            case 'instagram': return <InstagramLogo weight="fill" className="w-5 h-5" />;
            case 'twitter': return <TwitterLogo weight="fill" className="w-5 h-5" />;
            case 'linkedin': return <LinkedinLogo weight="fill" className="w-5 h-5" />;
            default: return <Article className="w-5 h-5" />;
        }
    };

    const getPlatformColor = (key: string) => {
        switch (key) {
            case 'youtube': return 'text-red-500 border-red-500/50 bg-red-500/10 hover:bg-red-500/20';
            case 'instagram': return 'text-pink-500 border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20';
            case 'twitter': return 'text-sky-500 border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20';
            case 'linkedin': return 'text-blue-600 border-blue-600/50 bg-blue-600/10 hover:bg-blue-600/20';
            default: return 'text-primary border-primary/50 bg-primary/10';
        }
    };

    const handlePlatformToggle = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (selectedPlatforms.length === 0) {
            alert('Please select at least one platform');
            return;
        }

        startTransition(async () => {
            try {
                await updateContentCard(card.id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    platforms: selectedPlatforms,
                    content_type: contentType || null,
                    series_id: selectedSeries,
                });

                onSuccess();
                // Close without warning since we just saved
                onOpenChange(false);
            } catch (error) {
                console.error('Failed to update content:', error);
                alert('Failed to update content. Please try again.');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => {
                if (hasChanges) {
                    e.preventDefault();
                    if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
                        onOpenChange(false);
                    }
                }
            }}>
                <DialogHeader className="text-center space-y-1">
                    <DialogTitle className="text-xl font-bold">Edit Content</DialogTitle>
                    <DialogDescription className="text-sm">
                        Update content details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-title" className="text-base font-semibold">Title</Label>
                        <Input
                            id="edit-title"
                            placeholder="Enter content title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium h-12"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-description" className="text-base font-semibold">Description</Label>
                        <Textarea
                            id="edit-description"
                            placeholder="Add a description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Platform Selection */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Platforms</Label>
                        <div className="flex flex-wrap gap-3">
                            {PLATFORMS.filter(p => p !== 'tiktok').map(platform => {
                                const isSelected = selectedPlatforms.includes(platform);
                                return (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => handlePlatformToggle(platform)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 capitalize font-medium",
                                            isSelected
                                                ? getPlatformColor(platform)
                                                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-secondary/50"
                                        )}
                                    >
                                        {getPlatformIcon(platform)}
                                        {platform}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row: Content Type & Series */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Content Type */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-contentType" className="font-semibold">Content Type</Label>
                            <Select value={contentType} onValueChange={setContentType} disabled={availableContentTypes.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={availableContentTypes.length === 0 ? "Select platforms first" : "Select type"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableContentTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Series */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-series" className="font-semibold">Series</Label>
                            <Select value={selectedSeries || 'none'} onValueChange={(v) => setSelectedSeries(v === 'none' ? null : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {series.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => handleClose(false)}
                            className="col-span-1"
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="col-span-3"
                            disabled={isPending || !title.trim() || selectedPlatforms.length === 0 || !hasChanges}
                        >
                            {isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
