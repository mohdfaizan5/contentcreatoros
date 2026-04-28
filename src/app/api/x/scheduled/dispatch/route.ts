import { NextRequest } from 'next/server';
import {
  dispatchScheduledTweets,
  recordScheduledDispatchRun,
} from '@/features/workflow/lib/generated-tweets-dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DispatchPayload = {
  dispatchRunId?: string;
  limit?: number;
  source?: string;
  tweetId?: string;
  tweetIds?: string[];
};

type DispatchRouteCode =
  | 'unauthorized'
  | 'missing-service-role'
  | 'no-due-tweets'
  | 'published'
  | 'failed';

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

function normalizeSource(
  payload: DispatchPayload,
  fallbackSource: 'manual_get' | 'manual_post',
) {
  const source = payload.source?.trim();
  return source ? source.slice(0, 80) : fallbackSource;
}

function isAuthorizedDispatchRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get('authorization')?.trim();

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  return process.env.NODE_ENV !== 'production';
}

function isMissingServiceRoleError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
  );
}

function buildRequestPayload(payload: DispatchPayload, tweetIds: string[], source: string) {
  return {
    dispatchRunId: payload.dispatchRunId ?? null,
    limit: payload.limit ?? null,
    source,
    tweetIds,
  };
}

function buildErrorResponse({
  code,
  dispatchRunId,
  error,
  httpStatus,
  source,
}: {
  code: DispatchRouteCode;
  dispatchRunId?: string;
  error: string;
  httpStatus: number;
  source: string;
}) {
  return Response.json(
    {
      code,
      dispatchRunId: dispatchRunId ?? null,
      error,
      failedCount: 0,
      httpStatus,
      processed: 0,
      publishedCount: 0,
      results: [],
      skippedCount: 0,
      source,
    },
    { status: httpStatus },
  );
}

async function safeRecordDispatchRun(payload: {
  dispatchRunId?: string;
  httpStatus: number;
  requestPayload: Record<string, unknown>;
  requestTarget: string;
  source: string;
  status: 'unauthorized' | 'misconfigured' | 'failed';
  topLevelError: string;
}) {
  try {
    await recordScheduledDispatchRun({
      dispatchRunId: payload.dispatchRunId,
      httpStatus: payload.httpStatus,
      requestPayload: payload.requestPayload,
      requestTarget: payload.requestTarget,
      source: payload.source,
      status: payload.status,
      topLevelError: payload.topLevelError,
      workerCompletedAt: new Date().toISOString(),
      workerStartedAt: new Date().toISOString(),
    });
  } catch {
    // Diagnostics should never prevent the dispatch route from returning a result.
  }
}

async function parseDispatchPayload(request: NextRequest) {
  if (request.method === 'GET') {
    return {
      dispatchRunId: request.nextUrl.searchParams.get('dispatchRunId') ?? undefined,
      limit: parseLimit(request.nextUrl.searchParams.get('limit')),
      source: request.nextUrl.searchParams.get('source') ?? undefined,
      tweetId: request.nextUrl.searchParams.get('tweetId') ?? undefined,
    } satisfies DispatchPayload;
  }

  try {
    const payload = (await request.json()) as DispatchPayload;
    return {
      ...payload,
      limit: parseLimit(payload.limit),
    };
  } catch {
    return {};
  }
}

async function runDispatch(request: NextRequest, payload: DispatchPayload = {}) {
  const source = normalizeSource(
    payload,
    request.method === 'GET' ? 'manual_get' : 'manual_post',
  );
  const tweetIds = normalizeTweetIds(payload);
  const requestTarget = request.nextUrl.origin + request.nextUrl.pathname;
  const requestPayload = buildRequestPayload(payload, tweetIds, source);

  if (!isAuthorizedDispatchRequest(request)) {
    if (payload.dispatchRunId || source === 'pg_cron') {
      await safeRecordDispatchRun({
        dispatchRunId: payload.dispatchRunId,
        httpStatus: 401,
        requestPayload,
        requestTarget,
        source,
        status: 'unauthorized',
        topLevelError: 'Invalid or missing CRON_SECRET for scheduled dispatch.',
      });
    }

    return buildErrorResponse({
      code: 'unauthorized',
      dispatchRunId: payload.dispatchRunId,
      error: 'Invalid or missing CRON_SECRET for scheduled dispatch.',
      httpStatus: 401,
      source,
    });
  }

  try {
    const result = await dispatchScheduledTweets({
      dispatchRunId: payload.dispatchRunId,
      limit: payload.limit,
      requestPayload,
      requestTarget,
      source,
      tweetIds,
    });

    return Response.json(
      {
        ...result,
      },
      { status: result.httpStatus },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to dispatch scheduled tweets.';
    const code: DispatchRouteCode = isMissingServiceRoleError(error)
      ? 'missing-service-role'
      : 'failed';
    const status = code === 'missing-service-role' ? 'misconfigured' : 'failed';
    const httpStatus = 500;

    if (payload.dispatchRunId || source === 'pg_cron') {
      await safeRecordDispatchRun({
        dispatchRunId: payload.dispatchRunId,
        httpStatus,
        requestPayload,
        requestTarget,
        source,
        status,
        topLevelError: message,
      });
    }

    return buildErrorResponse({
      code,
      dispatchRunId: payload.dispatchRunId,
      error: message,
      httpStatus,
      source,
    });
  }
}

export async function GET(request: NextRequest) {
  const payload = await parseDispatchPayload(request);
  return runDispatch(request, payload);
}

export async function POST(request: NextRequest) {
  const payload = await parseDispatchPayload(request);
  return runDispatch(request, payload);
}
