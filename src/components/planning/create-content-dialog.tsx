/**
 * Create Content Dialog
 * Dialog for creating new content cards with platform, series, and idea selection
 */

'use client';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createContentCard } from '@/actions/planning';
import { getIdeas } from '@/actions/ideas';
import { getSeries } from '@/actions/series';
import { PLATFORMS, getContentTypesForPlatforms } from '@/types/planning';
import type { Idea, Series } from '@/types/database';

interface CreateContentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialColumn: string;
}

export default function CreateContentDialog({
    open,
    onOpenChange,
    onSuccess,
    initialColumn,
}: CreateContentDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [contentType, setContentType] = useState<string>('');
    const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [series, setSeries] = useState<Series[]>([]);
    const [isPending, startTransition] = useTransition();

    // Load ideas and series when dialog opens
    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const [ideasData, seriesData] = await Promise.all([
                getIdeas(),
                getSeries(),
            ]);
            setIdeas(ideasData);
            setSeries(seriesData);
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    };

    // When an idea is selected, populate fields
    const handleIdeaSelect = (ideaId: string) => {
        if (ideaId === 'none') {
            setSelectedIdea(null);
            return;
        }

        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
            setSelectedIdea(ideaId);
            setTitle(idea.title);
            setDescription(idea.raw_text || '');
            if (idea.linked_series_id) {
                setSelectedSeries(idea.linked_series_id);
            }
            if (idea.target_platform) {
                setSelectedPlatforms([idea.target_platform]);
            }
        }
    };

    // Get available content types based on selected platforms
    const availableContentTypes = getContentTypesForPlatforms(selectedPlatforms);

    const handlePlatformToggle = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
        // Reset content type when platforms change
        setContentType('');
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
                await createContentCard({
                    title: title.trim(),
                    description: description.trim() || null,
                    idea_id: selectedIdea,
                    platforms: selectedPlatforms,
                    content_type: contentType || null,
                    series_id: selectedSeries,
                    column_id: initialColumn,
                });

                // Reset form
                setTitle('');
                setDescription('');
                setSelectedIdea(null);
                setSelectedPlatforms([]);
                setContentType('');
                setSelectedSeries(null);

                onSuccess();
                onOpenChange(false);
            } catch (error) {
                console.error('Failed to create content:', error);
                alert('Failed to create content. Please try again.');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Content</DialogTitle>
                    <DialogDescription>
                        Add a new piece of content to your planning board
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Pick from ideas or start fresh */}
                    <div className="space-y-2">
                        <Label>Pick from ideas or start fresh</Label>
                        <Select value={selectedIdea || 'none'} onValueChange={handleIdeaSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Start fresh or pick an idea" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Start fresh</SelectItem>
                                {ideas.map(idea => (
                                    <SelectItem key={idea.id} value={idea.id}>
                                        {idea.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="Enter content title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Add a description (optional)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Platform multiselect */}
                    <div className="space-y-2">
                        <Label>Platforms *</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {PLATFORMS.map(platform => (
                                <div key={platform} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={platform}
                                        checked={selectedPlatforms.includes(platform)}
                                        onCheckedChange={() => handlePlatformToggle(platform)}
                                    />
                                    <Label htmlFor={platform} className="capitalize cursor-pointer">
                                        {platform}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Type */}
                    {availableContentTypes.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="contentType">Content Type</Label>
                            <Select value={contentType} onValueChange={setContentType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableContentTypes.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Based on selected platforms: {selectedPlatforms.join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Series */}
                    <div className="space-y-2">
                        <Label htmlFor="series">Series (optional)</Label>
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

                    {/* Submit */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1"
                            disabled={isPending || !title.trim() || selectedPlatforms.length === 0}
                        >
                            {isPending ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
