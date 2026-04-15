import { createXAuthorizationUrl } from '@/lib/x/x';
import { getRequestOrigin } from '@/lib/request-origin';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authorizationUrl = await createXAuthorizationUrl(getRequestOrigin(request));
    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to start the X connection flow.';

    return NextResponse.redirect(
      new URL(`/app/analytics?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
