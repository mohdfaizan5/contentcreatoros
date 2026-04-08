export const X_OAUTH_SCOPES = [
  'users.read',
  'tweet.read',
  'tweet.write',
  'offline.access',
  'follows.read',
  'follows.write',
  'like.read',
  'like.write',
  'list.read',
  'list.write',
  'bookmark.read',
  'bookmark.write',
  'media.write',
] as const;

export const X_OAUTH_SCOPE_STRING = X_OAUTH_SCOPES.join(' ');
