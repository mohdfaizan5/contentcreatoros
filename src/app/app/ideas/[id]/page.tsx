/**
 * Idea Detail Page
 * Full-page view for viewing and editing an idea with Editor.js
 */

import { getIdea } from '@/actions/ideas';
import { notFound } from 'next/navigation';
import IdeaDetailClient from './idea-detail-client';

interface IdeaDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
    const { id } = await params;
    const idea = await getIdea(id);

    if (!idea) {
        notFound();
    }

    return <IdeaDetailClient idea={idea} />;
}
