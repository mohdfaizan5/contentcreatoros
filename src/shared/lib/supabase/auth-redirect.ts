const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

// USED FOR: - Determining the origin for authentication redirects, prioritizing the browser's current origin, then environment variables, and finally defaulting to localhost for development.
function normalizeOrigin(rawOrigin: string): string {
  return rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin;
}

function getConfiguredPublicOrigin() {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    return null;
  }

  const originWithProtocol = HTTP_PROTOCOL_REGEX.test(configuredOrigin)
    ? configuredOrigin
    : `https://${configuredOrigin}`;

  return normalizeOrigin(originWithProtocol);
}

function getBrowserOrigin() {
  if (typeof window === 'undefined') {
    return null;
  }

  return normalizeOrigin(window.location.origin);
}

export function getAuthOrigin() {
  const browserOrigin = getBrowserOrigin();
  if (browserOrigin) {
    return browserOrigin;
  }

  const configuredOrigin = getConfiguredPublicOrigin();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  return 'http://localhost:3000';
}

export function getOAuthRedirectTo(nextPath = '/app') {
  const normalizedNextPath = nextPath.startsWith('/') ? nextPath : '/app';
  const callbackUrl = new URL('/callback', getAuthOrigin());
  callbackUrl.searchParams.set('next', normalizedNextPath);
  return callbackUrl.toString();
}

export function getEmailRedirectTo(nextPath = '/app') {
  const normalizedNextPath = nextPath.startsWith('/') ? nextPath : '/app';
  return new URL(normalizedNextPath, getAuthOrigin()).toString();
}
