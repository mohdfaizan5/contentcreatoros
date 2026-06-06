-- Migration: Auto Engage runs and suggestion run linkage

CREATE TABLE IF NOT EXISTS public.auto_engage_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_account_id UUID NOT NULL REFERENCES public.x_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.auto_engage_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auto_engage_runs_user_id_idx
  ON public.auto_engage_runs(user_id);

CREATE INDEX IF NOT EXISTS auto_engage_runs_profile_id_idx
  ON public.auto_engage_runs(profile_id);

CREATE INDEX IF NOT EXISTS auto_engage_runs_created_at_idx
  ON public.auto_engage_runs(created_at DESC);

ALTER TABLE public.auto_engage_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own auto engage runs" ON public.auto_engage_runs;
CREATE POLICY "Users can view own auto engage runs"
ON public.auto_engage_runs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own auto engage runs" ON public.auto_engage_runs;
CREATE POLICY "Users can insert own auto engage runs"
ON public.auto_engage_runs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own auto engage runs" ON public.auto_engage_runs;
CREATE POLICY "Users can delete own auto engage runs"
ON public.auto_engage_runs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

ALTER TABLE public.auto_engage_suggestions
  ADD COLUMN IF NOT EXISTS run_id UUID REFERENCES public.auto_engage_runs(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS auto_engage_suggestions_daily_post_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS auto_engage_suggestions_run_post_unique_idx
  ON public.auto_engage_suggestions(run_id, x_post_id)
  WHERE run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS auto_engage_suggestions_run_id_idx
  ON public.auto_engage_suggestions(run_id);
