-- Migration: add durable scheduler diagnostics for Supabase pg_cron -> Next worker dispatch

CREATE TABLE IF NOT EXISTS public.scheduled_dispatch_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source TEXT NOT NULL DEFAULT 'manual',
  request_target TEXT,
  pg_net_request_id BIGINT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued',
  worker_started_at TIMESTAMPTZ,
  worker_completed_at TIMESTAMPTZ,
  http_status INTEGER,
  processed_count INTEGER NOT NULL DEFAULT 0,
  published_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  top_level_error TEXT,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT scheduled_dispatch_runs_status_check CHECK (
    status IN (
      'queued',
      'running',
      'completed',
      'completed_with_failures',
      'unauthorized',
      'misconfigured',
      'failed'
    )
  )
);

CREATE INDEX IF NOT EXISTS scheduled_dispatch_runs_created_at_idx
  ON public.scheduled_dispatch_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS scheduled_dispatch_runs_status_idx
  ON public.scheduled_dispatch_runs(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS scheduled_dispatch_runs_pg_net_request_id_idx
  ON public.scheduled_dispatch_runs(pg_net_request_id)
  WHERE pg_net_request_id IS NOT NULL;

DROP TRIGGER IF EXISTS scheduled_dispatch_runs_set_updated_at ON public.scheduled_dispatch_runs;
CREATE TRIGGER scheduled_dispatch_runs_set_updated_at
BEFORE UPDATE ON public.scheduled_dispatch_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scheduled_dispatch_runs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.scheduled_dispatch_run_http_responses AS
SELECT
  runs.id,
  runs.trigger_source,
  runs.request_target,
  runs.pg_net_request_id,
  runs.request_payload,
  runs.status,
  runs.worker_started_at,
  runs.worker_completed_at,
  runs.http_status,
  runs.processed_count,
  runs.published_count,
  runs.failed_count,
  runs.skipped_count,
  runs.top_level_error,
  runs.results,
  runs.created_at,
  runs.updated_at,
  responses.status_code AS pg_net_status_code,
  responses.error_msg AS pg_net_error_message,
  responses.content AS pg_net_response_body,
  responses.created AS pg_net_responded_at
FROM public.scheduled_dispatch_runs AS runs
LEFT JOIN net._http_response AS responses
  ON responses.id = runs.pg_net_request_id;

CREATE OR REPLACE FUNCTION public.dispatch_scheduled_tweets_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_base_url text;
  cron_secret text;
  dispatch_url text;
  dispatch_run_id uuid;
  request_id bigint;
  request_body jsonb;
  error_status text;
BEGIN
  INSERT INTO public.scheduled_dispatch_runs (
    trigger_source,
    status,
    request_payload
  )
  VALUES (
    'pg_cron',
    'queued',
    jsonb_build_object('source', 'pg_cron')
  )
  RETURNING id INTO dispatch_run_id;

  app_base_url := private.get_vault_secret('app_base_url');
  cron_secret := private.get_vault_secret('app_cron_secret');

  IF app_base_url IS NULL OR btrim(app_base_url) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_base_url". Set it in Vault or private.runtime_secrets before pg_cron can dispatch scheduled tweets.';
  END IF;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_cron_secret". Set it in Vault or private.runtime_secrets before pg_cron can dispatch scheduled tweets.';
  END IF;

  dispatch_url := rtrim(app_base_url, '/') || '/api/x/scheduled/dispatch';
  request_body := jsonb_build_object(
    'dispatchRunId', dispatch_run_id,
    'source', 'pg_cron'
  );

  UPDATE public.scheduled_dispatch_runs
  SET
    request_target = dispatch_url,
    request_payload = request_body
  WHERE id = dispatch_run_id;

  request_id := net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := request_body,
    timeout_milliseconds := 15000
  );

  UPDATE public.scheduled_dispatch_runs
  SET pg_net_request_id = request_id
  WHERE id = dispatch_run_id;
EXCEPTION
  WHEN OTHERS THEN
    error_status := CASE
      WHEN SQLERRM ILIKE 'Missing secret%' THEN 'misconfigured'
      ELSE 'failed'
    END;

    IF dispatch_run_id IS NOT NULL THEN
      UPDATE public.scheduled_dispatch_runs
      SET
        status = error_status,
        top_level_error = SQLERRM,
        worker_completed_at = NOW()
      WHERE id = dispatch_run_id;
    END IF;

    RAISE;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'dispatch-scheduled-tweets'
  ) THEN
    PERFORM cron.unschedule('dispatch-scheduled-tweets');
  END IF;
END
$$;

SELECT cron.schedule(
  'dispatch-scheduled-tweets',
  '* * * * *',
  'SELECT public.dispatch_scheduled_tweets_job();'
);
