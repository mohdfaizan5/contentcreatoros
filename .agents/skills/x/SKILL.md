---
name: X
description: Use when building applications that read, search, or publish posts on X; manage user relationships; access real-time data streams; or integrate X functionality into products. Agents should reach for this skill when users request API integration, data retrieval, authentication setup, or troubleshooting X API issues.
metadata:
    mintlify-proj: x
    version: "1.0"
---

# X API Skill Reference

## Product Summary

The X API provides programmatic access to X's public conversation through modern REST endpoints. Agents use it to read and publish posts, search historical data, stream real-time posts, manage user relationships, send direct messages, and access trends and analytics. The API uses pay-per-usage pricing with no subscriptions.

**Key resources:**
- **Primary docs:** https://docs.x.com/x-api/introduction
- **Developer Console:** https://console.x.com (create apps and manage credentials)
- **Base URL:** `https://api.x.com/2/`
- **Authentication:** Bearer Token (app-only), OAuth 1.0a, or OAuth 2.0
- **Official SDKs:** Python XDK and TypeScript XDK (handle auth, pagination, rate limiting automatically)

## When to Use

Reach for this skill when:

- **Reading data:** User wants to search posts, look up users, get timelines, or retrieve historical data
- **Publishing:** User needs to create posts, replies, or manage post content
- **Real-time streaming:** User wants to listen for posts matching specific criteria (filtered stream)
- **User management:** User needs to follow/unfollow, block, mute, or manage relationships
- **Direct messages:** User wants to send or retrieve private messages
- **Setup & auth:** User is configuring API access, generating credentials, or troubleshooting authentication
- **Rate limits or errors:** User hits 429 errors, 401 auth failures, or other API issues
- **Integration:** User is building a bot, dashboard, monitoring tool, or data pipeline

## Quick Reference

### Authentication Methods

| Method | Use Case | Setup |
|--------|----------|-------|
| **Bearer Token** | App-only, public data | Generate in Developer Console, pass as `Authorization: Bearer $TOKEN` |
| **OAuth 1.0a** | User context, private data | Use API Key + Secret to sign requests or generate user tokens |
| **OAuth 2.0** | User context, modern flow | Use Client ID + Secret for authorization code flow (recommended for new projects) |

### Common Endpoints

| Resource | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| User lookup | `/2/users/by/username/:username` | GET | Get user by username |
| Post lookup | `/2/tweets/:id` | GET | Get post by ID |
| Recent search | `/2/tweets/search/recent` | GET | Search last 7 days |
| Full-archive search | `/2/tweets/search/all` | GET | Search back to 2006 (paid) |
| Create post | `/2/tweets` | POST | Publish a post |
| Filtered stream | `/2/tweets/search/stream` | GET | Real-time posts matching rules |
| User timeline | `/2/users/:id/tweets` | GET | Get user's posts |
| Likes | `/2/users/:id/liked_tweets` | GET | Get user's liked posts |
| Direct messages | `/2/dm_events` | GET | Get DM conversations |

### Field Parameters

Request only needed data with `tweet.fields`, `user.fields`, `media.fields`, `poll.fields`:

```bash
curl "https://api.x.com/2/tweets/123?tweet.fields=created_at,public_metrics,lang" \
  -H "Authorization: Bearer $TOKEN"
```

Common fields: `created_at`, `public_metrics`, `author_id`, `conversation_id`, `lang`, `possibly_sensitive`

### Rate Limits

Check response headers for current status:
- `x-rate-limit-limit` — max requests allowed
- `x-rate-limit-remaining` — requests left in window
- `x-rate-limit-reset` — Unix timestamp when window resets

Most endpoints: 15-minute windows. Some: per-second or 24-hour. See [rate limits table](/x-api/fundamentals/rate-limits) for specifics.

### Pagination

Use `next_token` from response meta to fetch more results:

```bash
curl "https://api.x.com/2/tweets/search/recent?query=AI&pagination_token=b26v89c19zqg8o3fo7gesq314yb9l2l4ptqy" \
  -H "Authorization: Bearer $TOKEN"
```

SDKs handle pagination automatically.

## Decision Guidance

### When to Use Bearer Token vs. OAuth

| Scenario | Use Bearer Token | Use OAuth |
|----------|------------------|-----------|
| Reading public data only | ✓ | — |
| Publishing posts | — | ✓ (user context) |
| Accessing user's private data | — | ✓ |
| Bot/automated service | ✓ | — |
| User-facing app (sign in) | — | ✓ |

### When to Use Recent Search vs. Full-Archive Search

| Need | Recent Search | Full-Archive |
|------|---------------|--------------|
| Last 7 days of posts | ✓ | ✓ |
| Historical data (older) | — | ✓ |
| Cost | Free tier available | Paid (per-usage) |
| Query length | 512 chars | 1,024 chars |
| Max results per request | 100 | 500 |

### When to Use Filtered Stream vs. Polling

| Scenario | Filtered Stream | Polling (search) |
|----------|-----------------|------------------|
| Real-time updates | ✓ | — |
| Persistent connection | ✓ | — |
| Historical backfill | — | ✓ |
| Low latency required | ✓ | — |
| Simple one-off queries | — | ✓ |

## Workflow

### 1. Set Up API Access

1. Go to [console.x.com](https://console.x.com) and sign in
2. Create a new Project (or use existing)
3. Create an App within the Project
4. Generate credentials:
   - For app-only: Copy **Bearer Token**
   - For user context: Generate **API Key & Secret** (OAuth 1.0a) or **Client ID & Secret** (OAuth 2.0)
5. Store credentials securely (never commit to version control)

### 2. Make Your First Request

```bash
# Test with user lookup (no auth required for public data)
curl "https://api.x.com/2/users/by/username/xdevelopers" \
  -H "Authorization: Bearer $BEARER_TOKEN"
```

### 3. Build a Query (for search)

Use operators to filter posts:

```bash
# Search for AI posts in English, excluding retweets
curl "https://api.x.com/2/tweets/search/recent?query=AI%20lang:en%20-is:retweet" \
  -H "Authorization: Bearer $TOKEN"
```

Common operators: `from:username`, `to:username`, `has:images`, `has:links`, `lang:en`, `-is:retweet`, `-is:reply`

### 4. Request Additional Fields

By default, endpoints return minimal data. Add field parameters:

```bash
curl "https://api.x.com/2/tweets/123?tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=username" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Handle Pagination

Check response `meta.next_token`. If present, use it for next request:

```bash
curl "https://api.x.com/2/tweets/search/recent?query=AI&pagination_token=$NEXT_TOKEN" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Implement Error Handling

Check HTTP status and `errors` array in response:

```json
{
  "errors": [{
    "code": 88,
    "message": "Rate limit exceeded"
  }]
}
```

Common codes: 401 (auth failed), 403 (forbidden), 429 (rate limited), 400 (bad request)

### 7. Use an SDK for Production

For production, use official SDKs (Python or TypeScript) to handle auth, pagination, and rate limiting automatically.

## Common Gotchas

- **Bearer Token vs. User Token:** Bearer Token is app-only (public data). User-context endpoints require OAuth tokens. Check endpoint docs for requirements.
- **Field parameters are required:** Endpoints return minimal fields by default. Always add `tweet.fields`, `user.fields`, etc. to get needed data.
- **Expansions need fields:** To get author details in a post, use both `expansions=author_id` AND `user.fields=username,description`.
- **Rate limits reset on a schedule:** Don't retry immediately on 429. Wait until `x-rate-limit-reset` timestamp.
- **Query length limits:** Recent search: 512 chars. Full-archive: 1,024 chars. Enterprise: 4,096 chars.
- **Filtered stream requires persistent connection:** Don't close the connection after first post. Keep it open to receive matching posts.
- **Callback URLs must match exactly:** For OAuth flows, registered callback URLs must match request exactly (including trailing slashes, protocol).
- **Credentials shown only once:** When generating tokens in Developer Console, copy immediately—they won't be shown again.
- **Search is limited to 7 days by default:** Use full-archive search for historical data (requires paid access).
- **Deduplication applies:** Same resource requested twice in 24 hours is only charged once.

## Verification Checklist

Before submitting work with X API:

- [ ] Credentials are stored securely (not in code, use environment variables)
- [ ] Correct authentication method used (Bearer Token for app-only, OAuth for user context)
- [ ] Field parameters included to request needed data
- [ ] Pagination handled (next_token checked and used)
- [ ] Rate limit headers checked in response
- [ ] Error responses parsed and handled (check `errors` array)
- [ ] Query operators are valid (test with recent search first)
- [ ] Callback URLs registered in Developer Console (if using OAuth)
- [ ] API endpoint URL is correct (base: `https://api.x.com/2/`)
- [ ] Bearer Token or OAuth token is valid and not expired
- [ ] Request tested with cURL or Postman before integrating into code
- [ ] Expansions included when requesting related object fields

## Resources

**Comprehensive navigation:** https://docs.x.com/llms.txt

**Critical documentation:**
1. [X API Introduction](/x-api/introduction) — Overview, pricing, key features
2. [Make Your First Request](/make-your-first-request) — Step-by-step quickstart with examples
3. [Authentication Overview](/fundamentals/authentication/overview) — Auth methods and setup
4. [Rate Limits](/x-api/fundamentals/rate-limits) — Per-endpoint limits and handling
5. [Fields & Expansions](/x-api/fundamentals/fields) — How to request specific data
6. [Search Operators](/x-api/posts/search/integrate/operators) — Query syntax for posts
7. [Response Codes & Errors](/x-api/fundamentals/response-codes-and-errors) — Error handling
8. [Official SDKs](/tools-and-libraries) — Python and TypeScript libraries

---

> For additional documentation and navigation, see: https://docs.x.com/llms.txt