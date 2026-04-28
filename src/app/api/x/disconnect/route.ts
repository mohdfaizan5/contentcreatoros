import {
  disconnectCurrentUserXAccount,
  parseXAccountRole,
} from '@/features/x/lib/x-auth';
import { NextResponse, type NextRequest } from 'next/server';

async function disconnect(request: NextRequest, roleParam?: string | null) {
  const role =
    parseXAccountRole(roleParam ?? request.nextUrl.searchParams.get('role'));

  if (!role) {
    return NextResponse.redirect(
      new URL('/app/settings?error=Choose%20which%20X%20account%20to%20disconnect.', request.url),
    );
  }

  try {
    await disconnectCurrentUserXAccount(role);
    return NextResponse.redirect(
      new URL(`/app/settings?disconnected=1&role=${role}`, request.url),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to disconnect this X account.';

    return NextResponse.redirect(
      new URL(`/app/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}

export async function GET(request: NextRequest) {
  return disconnect(request);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return disconnect(request, String(formData.get('role') ?? ''));
}
