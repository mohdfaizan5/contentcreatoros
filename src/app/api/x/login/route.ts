import {
  createXAuthorizationUrl,
  getXRedirectUri,
  parseXAccountRole,
} from '@/features/x/lib/x-auth';
import { getRequestOrigin } from '@/features/inspiration/lib/request-origin';
import { NextResponse, type NextRequest } from 'next/server';

function getCanonicalXLoginUrl(request: NextRequest, origin: string) {
  const callbackOrigin = new URL(getXRedirectUri(origin)).origin;

  if (callbackOrigin === request.nextUrl.origin) {
    return null;
  }

  return new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, callbackOrigin);
}

export async function GET(request: NextRequest) {
  const role = parseXAccountRole(request.nextUrl.searchParams.get('role'));
  const origin = getRequestOrigin(request);
  const canonicalLoginUrl = getCanonicalXLoginUrl(request, origin);

  if (canonicalLoginUrl) {
    return NextResponse.redirect(canonicalLoginUrl);
  }

  try {
    const authorizationUrl = await createXAuthorizationUrl(
      origin,
      role ?? null,
    );
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to start the X connection flow.';

    return NextResponse.redirect(
      new URL(`/app/settings?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
