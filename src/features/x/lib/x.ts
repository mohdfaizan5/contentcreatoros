import { TwitterApi } from 'twitter-api-v2';

import {
  ensureStoredXAccessToken,
  forceRefreshStoredXAccessToken,
} from '@/features/x/lib/x-auth';
import {
  normalizePostMediaAttachments,
  POST_MEDIA_BUCKET,
  validatePostMediaAttachmentSet,
} from '@/features/x/lib/post-media';
import { createAdminClient } from '@/shared/lib/supabase/server-admin';
import type { PostMediaAttachment, XAccount } from '@/shared/types/database';

type XApiError = {
  detail?: string;
  errors?: Array<{ detail?: string; message?: string }>;
  message?: string;
  title?: string;
};

export type XUser = {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
  verified?: boolean;
};

export type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  referenced_tweets?: Array<{
    id: string;
    type: 'retweeted' | 'quoted' | 'replied_to';
  }>;
  public_metrics?: {
    like_count?: number;
    quote_count?: number;
    reply_count?: number;
    retweet_count?: number;
  };
};

type StoredXAccount = XAccount;

function createXUserClient(accessToken: string) {
  return new TwitterApi(accessToken);
}

function normalizeTwitterApiError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const maybeData = error as Error & {
    data?: XApiError;
    code?: number;
  };

  return (
    maybeData.data?.detail ||
    maybeData.data?.message ||
    maybeData.data?.title ||
    maybeData.data?.errors?.[0]?.detail ||
    maybeData.data?.errors?.[0]?.message ||
    error.message ||
    fallbackMessage
  );
}

async function loadStoredXAccountById(accountId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    throw new Error('Unable to load the stored X connection.');
  }

  return data as StoredXAccount;
}

function toTweetMediaIds(mediaIds: string[]) {
  switch (mediaIds.length) {
    case 0:
      return undefined;
    case 1:
      return [mediaIds[0]] as [string];
    case 2:
      return [mediaIds[0], mediaIds[1]] as [string, string];
    case 3:
      return [mediaIds[0], mediaIds[1], mediaIds[2]] as [string, string, string];
    default:
      return [mediaIds[0], mediaIds[1], mediaIds[2], mediaIds[3]] as [
        string,
        string,
        string,
        string,
      ];
  }
}

async function uploadPostMediaAttachmentsToX(
  client: TwitterApi,
  attachments: PostMediaAttachment[],
) {
  const normalizedAttachments = normalizePostMediaAttachments(attachments);

  validatePostMediaAttachmentSet(normalizedAttachments);

  if (!normalizedAttachments.length) {
    return [];
  }

  const supabase = createAdminClient();
  const mediaIds: string[] = [];

  for (const attachment of normalizedAttachments) {
    const { data, error } = await supabase.storage
      .from(attachment.bucket || POST_MEDIA_BUCKET)
      .download(attachment.path);

    if (error || !data) {
      throw new Error(`Unable to download attached media: ${attachment.file_name}.`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const mediaId = await client.v1.uploadMedia(buffer, {
      mimeType: attachment.mime_type,
      target: 'tweet',
    });

    mediaIds.push(mediaId);
  }

  return mediaIds;
}

async function createTweetWithMedia(
  accessToken: string,
  text: string,
  mediaAttachments: PostMediaAttachment[],
  delegateUserId?: string,
  replyToTweetId?: string,
) {
  const client = createXUserClient(accessToken);
  const mediaIds = await uploadPostMediaAttachmentsToX(client, mediaAttachments);
  const tweetMediaIds = toTweetMediaIds(mediaIds);

  const delegateHeaders = delegateUserId
    ? { 'x-as-user-id': delegateUserId }
    : undefined;
  void delegateHeaders;

  if (!tweetMediaIds && replyToTweetId) {
    return client.v2.reply(text, replyToTweetId);
  }

  if (!tweetMediaIds) {
    return client.v2.tweet(text);
  }

  const payload = {
    media: { media_ids: tweetMediaIds },
    text,
  };

  if (replyToTweetId) {
    return client.v2.reply(text, replyToTweetId, {
      media: { media_ids: tweetMediaIds },
    } as never);
  }

  return client.v2.tweet(payload);
}

export async function getAuthenticatedXUser(accessToken: string) {
  try {
    const client = createXUserClient(accessToken);
    const response = await client.v2.me({
      'user.fields': [
        'created_at',
        'description',
        'verified',
        'profile_image_url',
        'public_metrics',
      ],
    });

    return response.data as XUser;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated X user.'),
    );
  }
}

export async function getAuthenticatedUserTweets(accessToken: string, userId: string) {
  try {
    const client = createXUserClient(accessToken);
    const timeline = await client.v2.userTimeline(userId, {
      max_results: 100,
      'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
    });

    return timeline.tweets as XTweet[];
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated user timeline.'),
    );
  }
}

export async function getTweetsByIds(accessToken: string, tweetIds: string[]) {
  const uniqueTweetIds = [...new Set(tweetIds.map((tweetId) => tweetId.trim()).filter(Boolean))];

  if (!uniqueTweetIds.length) {
    return [] as XTweet[];
  }

  try {
    const client = createXUserClient(accessToken);
    const tweets: XTweet[] = [];

    for (let index = 0; index < uniqueTweetIds.length; index += 100) {
      const batch = uniqueTweetIds.slice(index, index + 100);
      const response = await client.v2.tweets(batch, {
        'tweet.fields': ['created_at', 'public_metrics'],
      });

      tweets.push(...((response.data ?? []) as XTweet[]));
    }

    return tweets;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load tweet metrics for this campaign.'),
    );
  }
}

export async function publishTweetWithStoredConnection(
  accountId: string,
  text: string,
  mediaAttachments: PostMediaAttachment[] = [],
  delegateUserId?: string,
  replyToTweetId?: string,
) {
  const account = await loadStoredXAccountById(accountId);

  if (!account.scope?.includes('tweet.write')) {
    throw new Error(
      'Your X connection is missing tweet.write permission. Reconnect X so we can request full publishing scopes and then try posting again.',
    );
  }

  let accessToken = await ensureStoredXAccessToken(account.id);

  try {
    const response = await createTweetWithMedia(
      accessToken,
      text,
      mediaAttachments,
      delegateUserId,
      replyToTweetId,
    );
    return response.data;
  } catch (error) {
    if (!account.refresh_token) {
      throw new Error(normalizeTwitterApiError(error, 'Unable to publish the scheduled tweet.'));
    }

    accessToken = await forceRefreshStoredXAccessToken(account.id);
    const response = await createTweetWithMedia(
      accessToken,
      text,
      mediaAttachments,
      delegateUserId,
      replyToTweetId,
    );
    return response.data;
  }
}
