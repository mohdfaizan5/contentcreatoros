-- Migration: persistent seven-day workflow planner queue, moderation state, and cron dispatch

CREATE TABLE IF NOT EXISTS public.seven_day_planning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  generation_model TEXT NOT NULL DEFAULT 'claude-haiku-4-5',
  generation_prompt_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_error TEXT,
  approved_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  scheduled_count INTEGER NOT NULL DEFAULT 0,
  scheduled_generated_tweet_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seven_day_planning_runs_status_check CHECK (
    status IN ('queued', 'generating', 'pending_approval', 'scheduled', 'failed', 'cancelled')
  ),
  CONSTRAINT seven_day_planning_runs_date_order_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS seven_day_planning_runs_user_id_idx
  ON public.seven_day_planning_runs(user_id);

CREATE INDEX IF NOT EXISTS seven_day_planning_runs_user_status_created_idx
  ON public.seven_day_planning_runs(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS seven_day_planning_runs_created_at_idx
  ON public.seven_day_planning_runs(created_at DESC);

DROP TRIGGER IF EXISTS seven_day_planning_runs_set_updated_at ON public.seven_day_planning_runs;
CREATE TRIGGER seven_day_planning_runs_set_updated_at
BEFORE UPDATE ON public.seven_day_planning_runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seven_day_planning_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own seven day planning runs" ON public.seven_day_planning_runs;
CREATE POLICY "Users can view own seven day planning runs"
ON public.seven_day_planning_runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own seven day planning runs" ON public.seven_day_planning_runs;
CREATE POLICY "Users can insert own seven day planning runs"
ON public.seven_day_planning_runs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own seven day planning runs" ON public.seven_day_planning_runs;
CREATE POLICY "Users can update own seven day planning runs"
ON public.seven_day_planning_runs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own seven day planning runs" ON public.seven_day_planning_runs;
CREATE POLICY "Users can delete own seven day planning runs"
ON public.seven_day_planning_runs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.seven_day_planning_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.seven_day_planning_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_date DATE NOT NULL,
  day_index INTEGER NOT NULL,
  day_label TEXT NOT NULL,
  pillar TEXT NOT NULL,
  content_type TEXT NOT NULL,
  angle TEXT NOT NULL,
  rationale TEXT NOT NULL,
  suggested_post TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  regeneration_count INTEGER NOT NULL DEFAULT 0,
  regeneration_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_tweet_id UUID REFERENCES public.generated_tweets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seven_day_planning_items_status_check CHECK (
    approval_status IN ('pending', 'approved', 'rejected', 'scheduled')
  ),
  CONSTRAINT seven_day_planning_items_day_index_check CHECK (day_index BETWEEN 0 AND 6),
  CONSTRAINT seven_day_planning_items_run_day_index_key UNIQUE (run_id, day_index),
  CONSTRAINT seven_day_planning_items_run_item_date_key UNIQUE (run_id, item_date)
);

CREATE INDEX IF NOT EXISTS seven_day_planning_items_user_id_idx
  ON public.seven_day_planning_items(user_id);

CREATE INDEX IF NOT EXISTS seven_day_planning_items_run_id_idx
  ON public.seven_day_planning_items(run_id);

CREATE INDEX IF NOT EXISTS seven_day_planning_items_run_status_idx
  ON public.seven_day_planning_items(run_id, approval_status);

CREATE INDEX IF NOT EXISTS seven_day_planning_items_user_item_date_idx
  ON public.seven_day_planning_items(user_id, item_date DESC);

DROP TRIGGER IF EXISTS seven_day_planning_items_set_updated_at ON public.seven_day_planning_items;
CREATE TRIGGER seven_day_planning_items_set_updated_at
BEFORE UPDATE ON public.seven_day_planning_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.seven_day_planning_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own seven day planning items" ON public.seven_day_planning_items;
CREATE POLICY "Users can view own seven day planning items"
ON public.seven_day_planning_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own seven day planning items" ON public.seven_day_planning_items;
CREATE POLICY "Users can insert own seven day planning items"
ON public.seven_day_planning_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own seven day planning items" ON public.seven_day_planning_items;
CREATE POLICY "Users can update own seven day planning items"
ON public.seven_day_planning_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own seven day planning items" ON public.seven_day_planning_items;
CREATE POLICY "Users can delete own seven day planning items"
ON public.seven_day_planning_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.dispatch_workflow_planning_runs_job()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_base_url text;
  cron_secret text;
  dispatch_url text;
BEGIN
  app_base_url := private.get_vault_secret('app_base_url');
  cron_secret := private.get_vault_secret('app_cron_secret');

  IF app_base_url IS NULL OR btrim(app_base_url) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_base_url". Set it in Vault or private.runtime_secrets before pg_cron can dispatch workflow planning runs.';
  END IF;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_cron_secret". Set it in Vault or private.runtime_secrets before pg_cron can dispatch workflow planning runs.';
  END IF;

  dispatch_url := rtrim(app_base_url, '/') || '/api/workflow/planner/dispatch';

  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('source', 'pg_cron')::jsonb,
    timeout_milliseconds := 20000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_workflow_planning_runs_job() FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'dispatch-workflow-planning-runs'
  ) THEN
    PERFORM cron.unschedule('dispatch-workflow-planning-runs');
  END IF;
END
$$;

SELECT cron.schedule(
  'dispatch-workflow-planning-runs',
  '* * * * *',
  'SELECT public.dispatch_workflow_planning_runs_job();'
);
