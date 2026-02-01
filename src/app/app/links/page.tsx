import { getMyProfile } from '@/actions/links';
import { LinksClient } from '@/components/links/links-client';

export default async function LinksPage() {
    const profile = await getMyProfile();
    return <LinksClient profile={profile} />;
}
