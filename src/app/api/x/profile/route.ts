import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

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

function extractHandle(rawValue: string | null): string | null {
  const input = rawValue?.trim();

  if (!input) {
    return null;
  }

  if (input.startsWith('@')) {
    const handle = input.slice(1).trim();
    return handle || null;
  }

  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    const hostname = url.hostname.toLowerCase();

    if (!hostname.includes('x.com') && !hostname.includes('twitter.com')) {
      return input.replace(/^@/, '').trim() || null;
    }

    const [firstPathSegment] = url.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    return firstPathSegment || null;
  } catch {
    return input.replace(/^@/, '').trim() || null;
  }
}

function getBearerToken() {
  return (
    process.env.X_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim() ||
    process.env.X_API_BEARER_TOKEN?.trim() ||
    null
  );
}

async function lookupWithOfficialApi(handle: string): Promise<LookupProfile | null> {
  const bearerToken = getBearerToken();

  if (!bearerToken) {
    return null;
  }

  try {
    const client = new TwitterApi(bearerToken);
    const response = await client.v2.userByUsername(handle, {
      'user.fields': ['description', 'profile_image_url', 'public_metrics', 'verified'],
    });

    const user = response.data;

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      profileImageUrl: user.profile_image_url,
      verified: user.verified,
      followersCount: user.public_metrics?.followers_count ?? null,
      followingCount: user.public_metrics?.following_count ?? null,
      tweetCount: user.public_metrics?.tweet_count ?? null,
    };
  } catch {
    return null;
  }
}

async function lookupWithSyndicationApi(handle: string): Promise<LookupProfile | null> {
  try {
    const response = await fetch(
      `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(handle)}`,
      {
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{
      id_str?: string;
      name?: string;
      screen_name?: string;
      followers_count?: number;
      friends_count?: number;
      profile_image_url?: string;
    }>;

    const account = payload?.[0];

    if (!account?.screen_name) {
      return null;
    }

    return {
      id: account.id_str,
      name: account.name || account.screen_name,
      username: account.screen_name,
      profileImageUrl: account.profile_image_url || null,
      followersCount: account.followers_count ?? null,
      followingCount: account.friends_count ?? null,
      tweetCount: null,
      verified: undefined,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = extractHandle(searchParams.get('handle'));

  if (!handle) {
    return NextResponse.json(
      {
        error: 'Provide a valid X handle or profile URL.',
      },
      { status: 400 },
    );
  }

  const profile =
    (await lookupWithOfficialApi(handle)) ||
    (await lookupWithSyndicationApi(handle));

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
      profile,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
