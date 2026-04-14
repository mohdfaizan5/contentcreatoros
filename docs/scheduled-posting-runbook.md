# Scheduled Posting Runbook

This project schedules X posts in two stages:

1. App code writes a row into `public.generated_tweets` with `status = 'scheduled'`.
2. Supabase `pg_cron` calls the Next worker at `/api/x/scheduled/dispatch`.
3. The worker claims due rows, publishes them to X, and updates the row to `published` or `failed`.

If a tweet stays stuck in `scheduled`, the bottleneck is almost always in the dispatch path, not in tweet creation.

## Required secrets

The app and Supabase cron must share the same secret.

`app_base_url` must be a publicly reachable HTTPS origin. Supabase cloud cron cannot call your local `localhost` dev server.

```sql
select private.set_runtime_secret('app_base_url', 'https://your-app-domain.example');
select private.set_runtime_secret('app_cron_secret', '<same value as app CRON_SECRET>');
```

The Next app must also have:

- `CRON_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`

## Check the cron job

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'dispatch-scheduled-tweets';
```

```sql
select *
from cron.job_run_details
where jobid in (
  select jobid
  from cron.job
  where jobname = 'dispatch-scheduled-tweets'
)
order by start_time desc
limit 20;
```

## Check queued HTTP requests and responses

`pg_cron` can succeed even when the HTTP request fails later. Always inspect `pg_net` too.

```sql
select *
from net._http_response
order by created desc
limit 20;
```

```sql
select *
from net._http_response
where status_code >= 400 or error_msg is not null
order by created desc
limit 20;
```

## Check durable dispatch logs

```sql
select
  id,
  trigger_source,
  status,
  http_status,
  processed_count,
  published_count,
  failed_count,
  skipped_count,
  top_level_error,
  created_at,
  worker_started_at,
  worker_completed_at
from public.scheduled_dispatch_runs
order by created_at desc
limit 20;
```

```sql
select
  id,
  trigger_source,
  status,
  http_status,
  pg_net_status_code,
  pg_net_error_message,
  top_level_error,
  created_at,
  pg_net_responded_at
from public.scheduled_dispatch_run_http_responses
order by created_at desc
limit 20;
```

## Check due tweets

```sql
select
  id,
  status,
  scheduled_for,
  published_at,
  x_account_id,
  x_tweet_id,
  error_message,
  updated_at
from public.generated_tweets
where status in ('scheduled', 'publishing', 'failed')
order by scheduled_for asc nulls last, updated_at desc
limit 50;
```

Overdue scheduled tweets:

```sql
select
  id,
  scheduled_for,
  x_account_id,
  error_message
from public.generated_tweets
where status = 'scheduled'
  and scheduled_for <= now()
order by scheduled_for asc;
```

## Check secret presence

```sql
select name, updated_at
from private.runtime_secrets
where name in ('app_base_url', 'app_cron_secret')
order by name;
```

If these rows do not exist, Supabase cron cannot reach the Next worker.

## Manual recovery

You can force a single overdue tweet through the same worker path.

```bash
curl -X POST "https://your-app-domain.example/api/x/scheduled/dispatch" \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"tweetId\":\"<generated_tweet_id>\",\"source\":\"manual_recovery\"}"
```

You can also process all currently due tweets:

```bash
curl -X POST "https://your-app-domain.example/api/x/scheduled/dispatch" \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -H "Content-Type: application/json" \
  -d "{\"source\":\"manual_recovery\"}"
```

## Typical failure patterns

- `scheduled` rows never change and there is no dispatch log:
  - Supabase cron is not running, or the migration that creates the cron job did not apply.
- Dispatch log exists with `status = unauthorized`:
  - `app_cron_secret` in Supabase does not match app `CRON_SECRET`.
- Dispatch log exists with `status = misconfigured`:
  - `app_base_url`, `app_cron_secret`, or app service-role env is missing.
- Dispatch log exists with `status = completed_with_failures`:
  - The worker reached the tweet row, but publishing to X failed. Inspect `error_message` on `generated_tweets`.
