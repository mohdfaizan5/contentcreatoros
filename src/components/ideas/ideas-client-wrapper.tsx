/**
 * Ideas Client Wrapper
 * Handles search and displays ideas in masonry layout
 */

'use client';

import { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { IdeaCard, IdeasList } from '@/components/ideas/idea-card';
import type { Idea } from '@/types/database';

interface IdeasClientProps {
    initialIdeas: Idea[];
}

export default function IdeasClient({ initialIdeas }: IdeasClientProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter ideas based on search query
    const filteredIdeas = initialIdeas.filter(idea =>
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.raw_text?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            {initialIdeas.length > 0 && (
                <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search ideas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            )}

            {/* Ideas List Header */}
            {filteredIdeas.length > 0 && (
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Your Ideas</h2>
                    <span className="text-sm text-muted-foreground">
                        {filteredIdeas.length} {searchQuery && `of ${initialIdeas.length}`} total
                    </span>
                </div>
            )}

            {/* No search results */}
            {searchQuery && filteredIdeas.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed bg-card/50">
                    <p className="text-muted-foreground">No ideas found matching "{searchQuery}"</p>
                </div>
            ) : (
                /* Masonry Grid */
                <div
                    className="columns-1 md:columns-2 lg:columns-3 gap-4"
                    style={{ columnFill: 'balance' }}
                >
                    {filteredIdeas.map((idea) => (
                        <div key={idea.id} className="mb-4 break-inside-avoid">
                            <IdeaCard idea={idea} />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {filteredIdeas.length === 0 && !searchQuery && <IdeasList ideas={[]} />}
        </div>
    );
}
