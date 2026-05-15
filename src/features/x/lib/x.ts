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
type XMediaProcessingInfo = {
  check_after_secs?: number;
  error?: {
    detail?: string;
    message?: string;
    name?: string;
  };
  progress_percent?: number;
  state?: 'pending' | 'in_progress' | 'succeeded' | 'failed';
};

type XMediaUploadResponse = {
  data?: {
    expires_after_secs?: number;
    id?: string;
    media_key?: string;
    processing_info?: XMediaProcessingInfo;
    size?: number;
  };
  errors?: Array<{
    detail?: string;
    message?: string;
    status?: number;
    title?: string;
  }>;
};

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

function getPostMediaCategory(attachment: PostMediaAttachment) {
  return attachment.media_type === 'gif' ? 'tweet_gif' : 'tweet_image';
}

async function parseXMediaUploadResponse(response: Response) {
  let body: XMediaUploadResponse | null = null;

  try {
    body = (await response.json()) as XMediaUploadResponse;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      body?.errors?.[0]?.detail ||
      body?.errors?.[0]?.message ||
      body?.errors?.[0]?.title ||
      `X media upload failed with status ${response.status}.`;
    throw new Error(message);
  }

  if (body?.errors?.length) {
    throw new Error(
      body.errors[0]?.detail ||
        body.errors[0]?.message ||
        body.errors[0]?.title ||
        'X media upload failed.',
    );
  }

  return body ?? {};
}

async function initializeChunkedXMediaUpload(
  accessToken: string,
  attachment: PostMediaAttachment,
) {
  const formData = new FormData();
  formData.set('command', 'INIT');
  formData.set('media_type', attachment.mime_type);
  formData.set('total_bytes', String(attachment.size_bytes));
  formData.set('media_category', getPostMediaCategory(attachment));

  const response = await fetch('https://api.x.com/2/media/upload', {
    body: formData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });

    const body = await parseXMediaUploadResponse(response);
    const mediaId = body.data?.id;

  if (!mediaId) {
    throw new Error('X did not return a media id for this upload.');
  }

  return mediaId;
}

async function appendChunkedXMediaUpload(params: {
  accessToken: string;
  mediaId: string;
  attachment: PostMediaAttachment;
  buffer: Buffer;
}) {
  const chunkSize = 5 * 1024 * 1024;

  for (let offset = 0, segmentIndex = 0; offset < params.buffer.length; offset += chunkSize, segmentIndex += 1) {
    const chunk = params.buffer.subarray(offset, offset + chunkSize);
    const formData = new FormData();
    formData.set('command', 'APPEND');
    formData.set('media_id', params.mediaId);
    formData.set('segment_index', String(segmentIndex));
    formData.set(
      'media',
      new File([new Uint8Array(chunk)], params.attachment.file_name, { type: params.attachment.mime_type }),
    );

    const response = await fetch('https://api.x.com/2/media/upload', {
      body: formData,
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
      method: 'POST',
    });

    await parseXMediaUploadResponse(response);
  }
}

async function finalizeChunkedXMediaUpload(accessToken: string, mediaId: string) {
  const formData = new FormData();
  formData.set('command', 'FINALIZE');
  formData.set('media_id', mediaId);

  const response = await fetch('https://api.x.com/2/media/upload', {
    body: formData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
  });

  return parseXMediaUploadResponse(response);
}

async function waitForXMediaProcessing(accessToken: string, mediaId: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const statusUrl = new URL('https://api.x.com/2/media/upload');
    statusUrl.searchParams.set('command', 'STATUS');
    statusUrl.searchParams.set('media_id', mediaId);

    const response = await fetch(statusUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await parseXMediaUploadResponse(response);
    const processingInfo = body.data?.processing_info;
    const state = processingInfo?.state;

    if (!state || state === 'succeeded') {
      return;
    }

    if (state === 'failed') {
      throw new Error(
        processingInfo?.error?.detail ||
          processingInfo?.error?.message ||
          processingInfo?.error?.name ||
          'X failed to process the uploaded media.',
      );
    }

    const delayMs = Math.max(1, processingInfo?.check_after_secs ?? 1) * 1000;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('X media processing took too long. Please try publishing again.');
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
  accessToken: string,
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
    const mediaId = await initializeChunkedXMediaUpload(accessToken, attachment);
    await appendChunkedXMediaUpload({
      accessToken,
      attachment,
      buffer,
      mediaId,
    });
    const finalized = await finalizeChunkedXMediaUpload(accessToken, mediaId);

    if (finalized.data?.processing_info) {
      await waitForXMediaProcessing(accessToken, mediaId);
    }

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
  const mediaIds = await uploadPostMediaAttachmentsToX(accessToken, mediaAttachments);
  const tweetMediaIds = toTweetMediaIds(mediaIds);
  void delegateUserId;

  return client.v2.tweet({
    ...(tweetMediaIds ? { media: { media_ids: tweetMediaIds } } : {}),
    ...(replyToTweetId ? { reply: { in_reply_to_tweet_id: replyToTweetId } } : {}),
    text,
  });
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
