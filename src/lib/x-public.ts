import { TwitterApi } from 'twitter-api-v2';
import type { XTweet, XUser } from '@/lib/x';

type SyndicationAccount = {
  friends_count?: number;
  followers_count?: number;
  id_str?: string;
  name?: string;
  profile_image_url?: string;
  screen_name?: string;
};

function getXBearerToken() {
  return (
    process.env.X_BEARER_TOKEN?.trim() ||
    process.env.TWITTER_BEARER_TOKEN?.trim() ||
    process.env.X_API_BEARER_TOKEN?.trim() ||
    process.env.BEARER_TOKEN?.trim() ||
    process.env.Bearer_Token?.trim() ||
    null
  );
}

async function lookupWithOfficialApi(handle: string): Promise<XUser | null> {
  const bearerToken = getXBearerToken();

  if (!bearerToken) {
    return null;
  }

  try {
    const client = new TwitterApi(bearerToken);
    const response = await client.v2.userByUsername(handle, {
      'user.fields': ['created_at', 'description', 'profile_image_url', 'public_metrics', 'verified'],
    });

    return (response.data as XUser | undefined) ?? null;
  } catch {
    return null;
  }
}

async function lookupWithSyndicationApi(handle: string): Promise<XUser | null> {
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

    const payload = (await response.json()) as SyndicationAccount[];
    const account = payload?.[0];

    if (!account?.screen_name) {
      return null;
    }

    return {
      id: account.id_str,
      name: account.name || account.screen_name,
      profile_image_url: account.profile_image_url || undefined,
      public_metrics: {
        followers_count: account.followers_count ?? undefined,
        following_count: account.friends_count ?? undefined,
      },
      username: account.screen_name,
    };
  } catch {
    return null;
  }
}

export async function lookupPublicXUserByHandle(handle: string) {
  return (
    (await lookupWithOfficialApi(handle)) ||
    (await lookupWithSyndicationApi(handle))
  );
}

export async function lookupPublicXTweetsByUserId(userId: string) {
  const bearerToken = getXBearerToken();

  if (!bearerToken) {
    return [] as XTweet[];
  }

  try {
    const client = new TwitterApi(bearerToken);
    const timeline = await client.v2.userTimeline(userId, {
      max_results: 5,
      'tweet.fields': ['created_at', 'public_metrics'],
    });

    return (timeline.tweets as XTweet[] | undefined) ?? [];
  } catch {
    return [] as XTweet[];
  }
}

export function hasPublicXLookupConfigured() {
  return Boolean(getXBearerToken());
}
