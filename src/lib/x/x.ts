import { cookies } from 'next/headers';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/server-admin';
import { X_OAUTH_SCOPES, X_OAUTH_SCOPE_STRING } from '@/lib/x/x-oauth';
import { ONBOARDING_FLOW_KEY } from '@/lib/onboarding';
import { extractXHandle } from '@/lib/x/x-handle';

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
  referenced_tweets?: Array<{
    id: string;
    type: 'retweeted' | 'quoted' | 'replied_to';
  }>;
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

type EnsureXAccessTokenOptions = {
  persistCookies?: boolean;
};

type StoredXAccount = {
  id: string;
  user_id: string;
  x_user_id: string;
  username: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scope: string[] | null;
  connected_at: string;
};

function getRequestedXScopes() {
  const customScopes = process.env.X_OAUTH_SCOPES?.trim();

  if (!customScopes) {
    return [...X_OAUTH_SCOPES];
  }

  const parsedScopes = customScopes
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  return parsedScopes.length > 0 ? parsedScopes : [...X_OAUTH_SCOPES];
}

function getExpiresInSeconds(expiresAt: string | null, fallbackSeconds = 7200) {
  if (!expiresAt) {
    return fallbackSeconds;
  }

  const expiresAtMs = new Date(expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs)) {
    return fallbackSeconds;
  }

  const remainingSeconds = Math.floor((expiresAtMs - Date.now()) / 1000);
  return Math.max(60, remainingSeconds);
}

function getXClientId() {
  return process.env.X_CLIENT_ID?.trim();
}

function getXClientSecret() {
  return process.env.X_CLIENT_SECRET?.trim() || process.env.Secret_Key?.trim();
}

function normalizeOrigin(rawOrigin: string) {
  return rawOrigin.endsWith('/') ? rawOrigin.slice(0, -1) : rawOrigin;
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

export function getXRedirectUri(origin: string) {
  const configuredCallback =
    process.env.X_CALLBACK_URL?.trim() ||
    process.env.X_REDIRECT_URI?.trim();

  if (configuredCallback) {
    return configuredCallback;
  }

  return `${normalizeOrigin(origin)}/api/x/callback`;
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
  const authLink = client.generateOAuth2AuthLink(getXRedirectUri(origin), {
    scope: getRequestedXScopes(),
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
      redirectUri: getXRedirectUri(origin),
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

async function upsertStoredXAccountForUser(
  userId: string,
  tokenResponse: XTokenResponse,
  user: XUser,
) {
  const supabase = await createClient();
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : null;
  const scope = tokenResponse.scope
    ? tokenResponse.scope.split(' ').filter(Boolean)
    : getRequestedXScopes();

  const { error } = await supabase.from('x_accounts').upsert(
    {
      user_id: userId,
      x_user_id: user.id,
      username: user.username,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token ?? null,
      expires_at: expiresAt,
      scope,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to save the X connection for scheduled posting.'),
    );
  }
}

export async function persistXConnectionForCurrentUser(tokenResponse: XTokenResponse) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const xUser = await getAuthenticatedXUser(tokenResponse.access_token);
  await upsertStoredXAccountForUser(user.id, tokenResponse, xUser);
}

export async function clearStoredXConnectionForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from('x_accounts').delete().eq('user_id', user.id);
}

export async function validateXOAuthState(state: string | null) {
  const cookieStore = await cookies();
  const savedState = cookieStore.get(X_STATE_COOKIE)?.value;

  return Boolean(state && savedState && state === savedState);
}

export async function getXConnectionMetadata() {
  const cookieStore = await cookies();
  const connectedAt = cookieStore.get(X_CONNECTED_AT_COOKIE)?.value;

  if (connectedAt) {
    return { connectedAt, username: null };
  }

  const storedAccount = await getStoredXAccountForCurrentUser();

  return {
    connectedAt: storedAccount?.connected_at,
    username: storedAccount?.username ?? null,
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

async function getStoredXAccountForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as StoredXAccount;
}

async function persistStoredXAccountTokens(account: StoredXAccount) {
  await persistXTokens({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expires_in: getExpiresInSeconds(account.expires_at),
    scope: account.scope?.join(' ') || X_OAUTH_SCOPE_STRING,
    token_type: 'bearer',
  });
}

async function restoreXAccessTokenFromStoredConnection(persistCookies: boolean) {
  let account = await getStoredXAccountForCurrentUser();

  if (!account) {
    return null;
  }

  const expiresAt = account.expires_at ? new Date(account.expires_at).getTime() : null;

  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    if (persistCookies) {
      await persistStoredXAccountTokens(account);
    }
    return account.access_token;
  }

  if (!account.refresh_token) {
    return null;
  }

  try {
    account = await refreshStoredXAccount(account);
    if (persistCookies) {
      await persistStoredXAccountTokens(account);
    }
    return account.access_token;
  } catch {
    return null;
  }
}

export async function ensureXAccessToken(
  origin: string,
  options: EnsureXAccessTokenOptions = {},
) {
  const persistCookies = options.persistCookies ?? true;
  const { accessToken, expiresAt, refreshToken } = await getXTokensFromCookies();

  if (!accessToken) {
    return restoreXAccessTokenFromStoredConnection(persistCookies);
  }

  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    return accessToken;
  }

  if (!refreshToken) {
    const restoredToken = await restoreXAccessTokenFromStoredConnection(persistCookies);

    if (restoredToken) {
      return restoredToken;
    }

    if (persistCookies) {
      await clearXSession();
    }
    return null;
  }

  try {
    const refreshedToken = await refreshXAccessToken(origin, refreshToken);
    if (persistCookies) {
      await persistXTokens({
        ...refreshedToken,
        refresh_token: refreshedToken.refresh_token ?? refreshToken,
      });
    }

    return refreshedToken.access_token;
  } catch {
    const restoredToken = await restoreXAccessTokenFromStoredConnection(persistCookies);

    if (restoredToken) {
      return restoredToken;
    }

    if (persistCookies) {
      await clearXSession();
    }
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
      max_results: 100,
      'tweet.fields': ['created_at', 'public_metrics', 'referenced_tweets'],
    });

    return timeline.tweets as XTweet[];
  } catch (error) {
    throw new Error(
      normalizeTwitterApiError(error, 'Unable to load the authenticated user timeline.'),
    );
  }
}

export async function hasStoredXConnectionForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { count, error } = await supabase
    .from('x_accounts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return !error && (count ?? 0) > 0;
}

function normalizeOnboardingAnswerToString(answer: unknown) {
  if (typeof answer === 'string') {
    return answer.trim();
  }

  if (answer && typeof answer === 'object') {
    const record = answer as Record<string, unknown>;
    const value = record.value;
    return typeof value === 'string' ? value.trim() : '';
  }

  return '';
}

export async function getCurrentUserLinkedXHandle() {
  const storedAccount = await getStoredXAccountForCurrentUser();

  if (storedAccount?.username) {
    return storedAccount.username;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: onboardingAnswer } = await supabase
    .from('onboarding_answers')
    .select('answer')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .eq('question_key', 'x_account')
    .maybeSingle();

  const linkedHandle = extractXHandle(
    normalizeOnboardingAnswerToString(onboardingAnswer?.answer),
  );

  if (linkedHandle) {
    return linkedHandle;
  }

  const { data: autofillProfile } = await supabase
    .from('onboarding_autofill_profiles')
    .select('x_handle')
    .eq('user_id', user.id)
    .eq('flow_key', ONBOARDING_FLOW_KEY)
    .maybeSingle();

  return extractXHandle(autofillProfile?.x_handle ?? null);
}

async function getStoredXAccountById(accountId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('x_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error || !data) {
    throw new Error('Unable to load the stored X connection.');
  }

  return data as StoredXAccount;
}

async function updateStoredXAccountTokens(
  accountId: string,
  tokenResponse: XTokenResponse,
  user: XUser,
) {
  const supabase = createAdminClient();
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : null;
  const scope = tokenResponse.scope
    ? tokenResponse.scope.split(' ').filter(Boolean)
    : getRequestedXScopes();

  const { data, error } = await supabase
    .from('x_accounts')
    .update({
      x_user_id: user.id,
      username: user.username,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token ?? null,
      expires_at: expiresAt,
      scope,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Unable to refresh the stored X connection.');
  }

  return data as StoredXAccount;
}

async function refreshStoredXAccount(account: StoredXAccount) {
  if (!account.refresh_token) {
    throw new Error('Missing refresh token for scheduled X publishing.');
  }

  const refreshedToken = await refreshXAccessToken('', account.refresh_token);
  const refreshedUser = await getAuthenticatedXUser(refreshedToken.access_token);

  return updateStoredXAccountTokens(
    account.id,
    {
      ...refreshedToken,
      refresh_token: refreshedToken.refresh_token ?? account.refresh_token,
    },
    refreshedUser,
  );
}

export async function publishTweetWithStoredConnection(accountId: string, text: string) {
  let account = await getStoredXAccountById(accountId);
  const expiresAt = account.expires_at ? new Date(account.expires_at).getTime() : null;

  if (!account.scope?.includes('tweet.write')) {
    throw new Error(
      'Your X connection is missing tweet.write scope. Reconnect X with X_OAUTH_SCOPES including tweet.write to publish posts.',
    );
  }

  if (expiresAt && expiresAt <= Date.now() + 60_000) {
    account = await refreshStoredXAccount(account);
  }

  try {
    const client = createXUserClient(account.access_token);
    const response = await client.v2.tweet(text);
    return response.data;
  } catch (error) {
    if (!account.refresh_token) {
      throw new Error(normalizeTwitterApiError(error, 'Unable to publish the scheduled tweet.'));
    }

    const refreshedAccount = await refreshStoredXAccount(account);
    const client = createXUserClient(refreshedAccount.access_token);
    const response = await client.v2.tweet(text);
    return response.data;
  }
}
