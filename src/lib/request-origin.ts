import { type NextRequest } from 'next/server';

const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

function normalizeOrigin(rawOrigin: string) {
  return rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin;
}

export function getConfiguredPublicOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    return null;
  }

  const originWithProtocol = HTTP_PROTOCOL_REGEX.test(configuredOrigin)
    ? configuredOrigin
    : `https://${configuredOrigin}`;

  return normalizeOrigin(originWithProtocol);
}

export function getRequestOrigin(request: NextRequest) {
  const configuredOrigin = getConfiguredPublicOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedHost) {
    return normalizeOrigin(`${forwardedProto ?? 'https'}://${forwardedHost}`);
  }

  return normalizeOrigin(request.nextUrl.origin);
}
