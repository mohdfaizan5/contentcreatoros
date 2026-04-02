import { cookies } from 'next/headers';
import { TwitterApi } from 'twitter-api-v2';

const X_SCOPE = ['users.read', 'tweet.read', 'offline.access'] as const;

const X_STATE_COOKIE = 'x_oauth_state';
const X_CODE_VERIFIER_COOKIE = 'x_oauth_code_verifier';
const X_ACCESS_TOKEN_COOKIE = 'x_access_token';
const X_REFRESH_TOKEN_COOKIE = 'x_refresh_token';
const X_TOKEN_EXPIRY_COOKIE = 'x_token_expires_at';
const X_CONNECTED_AT_COOKIE = 'x_connected_at';

type XTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type XApiError = {
  detail?: string;
  errors?: Array<{ detail?: string; message?: string }>;
  message?: string;
  title?: string;
};

export type XUser = {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  description?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
  verified?: boolean;
};

export type XTweet = {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    like_count?: number;
    quote_count?: number;
    reply_count?: number;
    retweet_count?: number;
  };
};

type XCookieTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
};

function getXClientId() {
  return process.env.X_CLIENT_ID?.trim();
}

function getXClientSecret() {
  return process.env.X_CLIENT_SECRET?.trim() || process.env.Secret_Key?.trim();
}

function createCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    maxAge,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  };
}

function getRedirectUri(origin: string) {
  return `${origin}/api/x/callback`;
}

function createXOAuthClient() {
  const clientId = getXClientId();
  const clientSecret = getXClientSecret();

  if (!clientId) {
    throw new Error('Missing X_CLIENT_ID. Add it to your environment before connecting X.');
  }

  return clientSecret
    ? new TwitterApi({ clientId, clientSecret })
    : new TwitterApi({ clientId });
}

function createXUserClient(accessToken: string) {
  return new TwitterApi(accessToken);
}

function normalizeTwitterApiError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const maybeData = error as Error & {
    data?: XApiError;
    code?: number;
  };

  return (
    maybeData.data?.detail ||
    maybeData.data?.message ||
    maybeData.data?.title ||
    maybeData.data?.errors?.[0]?.detail ||
    maybeData.data?.errors?.[0]?.message ||
    error.message ||
    fallbackMessage
  );
}

export function getXConfigStatus() {
  const clientId = getXClientId();

  return {
    clientId,
    configured: Boolean(clientId),
    hasClientSecret: Boolean(getXClientSecret()),
  };
}

export async function createXAuthorizationUrl(origin: string) {
  const client = createXOAuthClient();
  const cookieStore = await cookies();
  const authLink = client.generateOAuth2AuthLink(getRedirectUri(origin), {
    scope: [...X_SCOPE],
  });

  cookieStore.set(X_STATE_COOKIE, authLink.state, createCookieOptions(60 * 10));
  cookieStore.set(
    X_CODE_VERIFIER_COOKIE,
    authLink.codeVerifier,
    createCookieOptions(60 * 10),
  );

  return authLink.url;
}

export async function exchangeXCodeForToken(code: string, origin: string) {
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get(X_CODE_VERIFIER_COOKIE)?.value;

  if (!codeVerifier) {
    throw new Error('Missing code verifier cookie. Start the X connection again.');
  }

  try {
    const client = createXOAuthClient();
    const tokenResult = await client.loginWithOAuth2({
      code,
      redirectUri: getRedirectUri(origin),
      codeVerifier,
    });

    return {
      access_token: tokenResult.accessToken,
      expires_in: tokenResult.expiresIn,
      refresh_token: tokenResult.refreshToken,
      scope: tokenResult.scope.join(' '),
      token_type: 'bearer',
    } satisfies XTokenResponse;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(
        error,
        'Unable to exchange the X authorization code for tokens.',
      ),
    );
  }
}

export async function refreshXAccessToken(origin: string, refreshToken: string) {
  try {
    const client = createXOAuthClient();
    const tokenResult = await client.refreshOAuth2Token(refreshToken);

    return {
      access_token: tokenResult.accessToken,
      expires_in: tokenResult.expiresIn,
      refresh_token: tokenResult.refreshToken,
      scope: tokenResult.scope.join(' '),
      token_type: 'bearer',
    } satisfies XTokenResponse;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to refresh the X access token.'),
    );
  }
}

export async function persistXTokens(tokenResponse: XTokenResponse) {
  const cookieStore = await cookies();
  const expiresIn = tokenResponse.expires_in ?? 7200;
  const expiresAt = Date.now() + expiresIn * 1000;

  cookieStore.set(X_ACCESS_TOKEN_COOKIE, tokenResponse.access_token, createCookieOptions(expiresIn));
  cookieStore.set(X_TOKEN_EXPIRY_COOKIE, String(expiresAt), createCookieOptions(expiresIn));
  cookieStore.set(X_CONNECTED_AT_COOKIE, new Date().toISOString(), createCookieOptions(60 * 60 * 24 * 30));

  if (tokenResponse.refresh_token) {
    cookieStore.set(
      X_REFRESH_TOKEN_COOKIE,
      tokenResponse.refresh_token,
      createCookieOptions(60 * 60 * 24 * 30),
    );
  }

  cookieStore.delete(X_STATE_COOKIE);
  cookieStore.delete(X_CODE_VERIFIER_COOKIE);
}

export async function clearXSession() {
  const cookieStore = await cookies();

  [
    X_STATE_COOKIE,
    X_CODE_VERIFIER_COOKIE,
    X_ACCESS_TOKEN_COOKIE,
    X_REFRESH_TOKEN_COOKIE,
    X_TOKEN_EXPIRY_COOKIE,
    X_CONNECTED_AT_COOKIE,
  ].forEach((name) => {
    cookieStore.delete(name);
  });
}

export async function validateXOAuthState(state: string | null) {
  const cookieStore = await cookies();
  const savedState = cookieStore.get(X_STATE_COOKIE)?.value;

  return Boolean(state && savedState && state === savedState);
}

export async function getXConnectionMetadata() {
  const cookieStore = await cookies();

  return {
    connectedAt: cookieStore.get(X_CONNECTED_AT_COOKIE)?.value,
  };
}

async function getXTokensFromCookies(): Promise<XCookieTokens> {
  const cookieStore = await cookies();
  const expiresAtValue = cookieStore.get(X_TOKEN_EXPIRY_COOKIE)?.value;
  const expiresAt = expiresAtValue ? Number(expiresAtValue) : undefined;

  return {
    accessToken: cookieStore.get(X_ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: cookieStore.get(X_REFRESH_TOKEN_COOKIE)?.value,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : undefined,
  };
}

export async function ensureXAccessToken(origin: string) {
  const { accessToken, expiresAt, refreshToken } = await getXTokensFromCookies();

  if (!accessToken) {
    return null;
  }

  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    return accessToken;
  }

  if (!refreshToken) {
    await clearXSession();
    return null;
  }

  try {
    const refreshedToken = await refreshXAccessToken(origin, refreshToken);
    await persistXTokens({
      ...refreshedToken,
      refresh_token: refreshedToken.refresh_token ?? refreshToken,
    });

    return refreshedToken.access_token;
  } catch {
    await clearXSession();
    return null;
  }
}

export async function getAuthenticatedXUser(accessToken: string) {
  try {
    const client = createXUserClient(accessToken);
    const response = await client.v2.me({
      'user.fields': [
        'created_at',
        'description',
        'verified',
        'profile_image_url',
        'public_metrics',
      ],
    });

    return response.data as XUser;
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated X user.'),
    );
  }
}

export async function getAuthenticatedUserTweets(accessToken: string, userId: string) {
  try {
    const client = createXUserClient(accessToken);
    const timeline = await client.v2.userTimeline(userId, {
      max_results: 5,
      'tweet.fields': ['created_at', 'public_metrics'],
    });

    return timeline.tweets as XTweet[];
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated user timeline.'),
    );
  }
}
