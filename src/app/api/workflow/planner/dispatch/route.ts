import { NextRequest } from 'next/server';

import { dispatchWorkflowPlanningRuns } from '@/lib/workflow-planner-dispatch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type DispatchPayload = {
  runId?: string;
  source?: string;
};

type WorkflowDispatchCode =
  | 'unauthorized'
  | 'missing-service-role'
  | 'no-queued-runs'
  | 'processed'
  | 'failed';

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

function buildErrorResponse({
  code,
  error,
  httpStatus,
  runId,
  source,
}: {
  code: WorkflowDispatchCode;
  error: string;
  httpStatus: number;
  runId?: string;
  source: string;
}) {
  return Response.json(
    {
      code,
      error,
      generatedItems: 0,
      processedRuns: 0,
      runId: runId ?? null,
      source,
    },
    { status: httpStatus },
  );
}

async function parsePayload(request: NextRequest) {
  if (request.method === 'GET') {
    return {
      runId: request.nextUrl.searchParams.get('runId') ?? undefined,
      source: request.nextUrl.searchParams.get('source') ?? undefined,
    } satisfies DispatchPayload;
  }

  try {
    const payload = (await request.json()) as DispatchPayload;
    return payload;
  } catch {
    return {};
  }
}

async function runDispatch(request: NextRequest, payload: DispatchPayload = {}) {
  const source = normalizeSource(
    payload,
    request.method === 'GET' ? 'manual_get' : 'manual_post',
  );

  if (!isAuthorizedDispatchRequest(request)) {
    return buildErrorResponse({
      code: 'unauthorized',
      error: 'Invalid or missing CRON_SECRET for workflow planning dispatch.',
      httpStatus: 401,
      runId: payload.runId,
      source,
    });
  }

  try {
    const result = await dispatchWorkflowPlanningRuns({
      runId: payload.runId,
      source,
    });

    const code: WorkflowDispatchCode =
      result.code === 'processed'
        ? 'processed'
        : result.code === 'no-queued-runs'
          ? 'no-queued-runs'
          : 'failed';

    return Response.json(
      {
        ...result,
        code,
      },
      { status: code === 'failed' ? 500 : 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to dispatch workflow planning runs.';

    const code: WorkflowDispatchCode = isMissingServiceRoleError(error)
      ? 'missing-service-role'
      : 'failed';

    return buildErrorResponse({
      code,
      error: message,
      httpStatus: 500,
      runId: payload.runId,
      source,
    });
  }
}

export async function GET(request: NextRequest) {
  const payload = await parsePayload(request);
  return runDispatch(request, payload);
}

export async function POST(request: NextRequest) {
  const payload = await parsePayload(request);
  return runDispatch(request, payload);
}
