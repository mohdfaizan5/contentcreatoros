import { NextResponse } from 'next/server';
import { extractXHandle } from '@/features/x/lib/x-handle';
import { lookupPublicXUserByHandle } from '@/features/x/lib/x-public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LookupProfile = {
  id?: string;
  name: string;
  username: string;
  profileImageUrl?: string | null;
  verified?: boolean;
  followersCount?: number | null;
  followingCount?: number | null;
  tweetCount?: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = extractXHandle(searchParams.get('handle'));

  if (!handle) {
    return NextResponse.json(
      {
        error: 'Provide a valid X handle or profile URL.',
      },
      { status: 400 },
    );
  }

  const profile = await lookupPublicXUserByHandle(handle);

  if (!profile) {
    return NextResponse.json(
      {
        error: 'Unable to find this X account right now.',
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      profile: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profileImageUrl: profile.profile_image_url ?? null,
        verified: profile.verified,
        followersCount: profile.public_metrics?.followers_count ?? null,
        followingCount: profile.public_metrics?.following_count ?? null,
        tweetCount: profile.public_metrics?.tweet_count ?? null,
      } satisfies LookupProfile,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

