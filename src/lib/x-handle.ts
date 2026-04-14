const HTTP_PROTOCOL_REGEX = /^https?:\/\//i;

export function extractXHandle(rawValue: string | null | undefined): string | null {
  const input = rawValue?.trim();

  if (!input) {
    return null;
  }

  if (input.startsWith('@')) {
    const handle = input.slice(1).trim();
    return handle || null;
  }

  try {
    const url = new URL(
      HTTP_PROTOCOL_REGEX.test(input) ? input : `https://${input}`,
    );
    const hostname = url.hostname.toLowerCase();

    if (!hostname.includes('x.com') && !hostname.includes('twitter.com')) {
      return input.replace(/^@/, '').trim() || null;
    }

    const [firstPathSegment] = url.pathname
      .split('/')
      .map((segment) => segment.trim())
      .filter(Boolean);

    return firstPathSegment || null;
  } catch {
    return input.replace(/^@/, '').trim() || null;
  }
}
