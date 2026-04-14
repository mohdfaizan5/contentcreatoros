import {
  clearXSession,
  exchangeXCodeForToken,
  persistXConnectionForCurrentUser,
  persistXTokens,
  validateXOAuthState,
} from '@/lib/x';
import { getRequestOrigin } from '@/lib/request-origin';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const xError = searchParams.get('error');
  const xErrorDescription = searchParams.get('error_description');

  if (xError) {
    await clearXSession();
    return NextResponse.redirect(
      new URL(
        `/app/analytics?error=${encodeURIComponent(xErrorDescription || xError)}`,
        request.url,
      ),
    );
  }

  if (!code) {
    await clearXSession();
    return NextResponse.redirect(
      new URL('/app/analytics?error=Missing%20authorization%20code', request.url),
    );
  }

  const isValidState = await validateXOAuthState(state);

  if (!isValidState) {
    await clearXSession();
    return NextResponse.redirect(
      new URL('/app/analytics?error=Invalid%20X%20OAuth%20state', request.url),
    );
  }

  try {
    const tokenResponse = await exchangeXCodeForToken(code, getRequestOrigin(request));
    await persistXTokens(tokenResponse);
    await persistXConnectionForCurrentUser(tokenResponse);

    return NextResponse.redirect(new URL('/app/analytics?connected=1', request.url));
  } catch (error) {
    await clearXSession();

    const message =
      error instanceof Error ? error.message : 'Unable to complete the X connection.';

    return NextResponse.redirect(
      new URL(`/app/analytics?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
