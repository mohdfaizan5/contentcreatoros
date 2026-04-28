import { getMyProfile } from '@/features/(legacy)/links/actions/links';
import { LinksClient } from '@/features/(legacy)/links/components/links-client';

export default async function LinksPage() {
    const profile = await getMyProfile();
    return <LinksClient profile={profile} />;
}
