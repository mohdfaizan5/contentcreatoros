import {
  clearPendingXAuthorizationAttempts,
  completeXAuthorizationCallback,
} from '@/features/x/lib/x-auth';
import { getRequestOrigin } from '@/features/inspiration/lib/request-origin';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const xError = searchParams.get('error');
  const xErrorDescription = searchParams.get('error_description');

  if (xError) {
    await clearPendingXAuthorizationAttempts();
    return NextResponse.redirect(
      new URL(
        `/app/settings?error=${encodeURIComponent(xErrorDescription || xError)}`,
        request.url,
      ),
    );
  }

  if (!code) {
    await clearPendingXAuthorizationAttempts();
    return NextResponse.redirect(
      new URL('/app/settings?error=Missing%20authorization%20code', request.url),
    );
  }

  try {
    const { role } = await completeXAuthorizationCallback({
      code,
      origin: getRequestOrigin(request),
      state,
    });

    const redirectPath = role
      ? `/app/settings?connected=1&role=${role}`
      : '/app/settings?connected=1';

    return NextResponse.redirect(
      new URL(redirectPath, request.url),
    );
  } catch (error) {
    await clearPendingXAuthorizationAttempts();

    const message =
      error instanceof Error ? error.message : 'Unable to complete the X connection.';

    return NextResponse.redirect(
      new URL(`/app/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
