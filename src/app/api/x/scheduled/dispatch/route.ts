import { NextRequest } from 'next/server';
import { dispatchScheduledTweets } from '@/lib/generated-tweets-dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DispatchPayload = {
  limit?: number;
  tweetId?: string;
  tweetIds?: string[];
};

function parseLimit(rawLimit: string | number | null | undefined) {
  if (rawLimit === null || rawLimit === undefined || rawLimit === '') {
    return undefined;
  }

  const parsed = Number(rawLimit);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeTweetIds(payload: DispatchPayload) {
  const ids = [...(payload.tweetIds ?? [])];

  if (payload.tweetId) {
    ids.push(payload.tweetId);
  }

  return Array.from(new Set(ids.filter(Boolean)));
}

function isAuthorizedDispatchRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization')?.trim();

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  return process.env.NODE_ENV !== 'production';
}

async function runDispatch(request: NextRequest, payload: DispatchPayload = {}) {
  if (!isAuthorizedDispatchRequest(request)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await dispatchScheduledTweets({
      limit: payload.limit,
      tweetIds: normalizeTweetIds(payload),
    });

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to dispatch scheduled tweets.',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const limitFromQuery = parseLimit(request.nextUrl.searchParams.get('limit'));
  const tweetId = request.nextUrl.searchParams.get('tweetId') ?? undefined;

  return runDispatch(request, {
    limit: limitFromQuery,
    tweetId,
  });
}

export async function POST(request: NextRequest) {
  let payload: DispatchPayload = {};

  try {
    payload = (await request.json()) as DispatchPayload;
  } catch {
    payload = {};
  }

  return runDispatch(request, {
    ...payload,
    limit: parseLimit(payload.limit),
  });
}
