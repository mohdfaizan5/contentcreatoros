-- Migration: store X account metric baselines and future growth snapshots

CREATE TABLE IF NOT EXISTS public.x_account_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_account_id UUID NOT NULL REFERENCES public.x_accounts(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  account_role TEXT,
  snapshot_type TEXT NOT NULL DEFAULT 'onboarding',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  followers_count INTEGER,
  following_count INTEGER,
  tweet_count INTEGER,
  listed_count INTEGER,
  verified BOOLEAN,
  profile_image_url TEXT,
  raw_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT x_account_metric_snapshots_account_role_check
    CHECK (account_role IN ('founder', 'company') OR account_role IS NULL),
  CONSTRAINT x_account_metric_snapshots_snapshot_type_check
    CHECK (snapshot_type IN ('onboarding', 'reconnect', 'manual', 'backfill'))
);

CREATE INDEX IF NOT EXISTS x_account_metric_snapshots_user_captured_at_idx
  ON public.x_account_metric_snapshots(user_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS x_account_metric_snapshots_x_account_captured_at_idx
  ON public.x_account_metric_snapshots(x_account_id, captured_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS x_account_metric_snapshots_onboarding_unique_idx
  ON public.x_account_metric_snapshots(x_account_id)
  WHERE snapshot_type = 'onboarding';

DROP TRIGGER IF EXISTS x_account_metric_snapshots_set_updated_at
  ON public.x_account_metric_snapshots;
CREATE TRIGGER x_account_metric_snapshots_set_updated_at
BEFORE UPDATE ON public.x_account_metric_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.x_account_metric_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own x account metric snapshots"
  ON public.x_account_metric_snapshots;
CREATE POLICY "Users can view own x account metric snapshots"
ON public.x_account_metric_snapshots
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own x account metric snapshots"
  ON public.x_account_metric_snapshots;
CREATE POLICY "Users can insert own x account metric snapshots"
ON public.x_account_metric_snapshots
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own x account metric snapshots"
  ON public.x_account_metric_snapshots;
CREATE POLICY "Users can update own x account metric snapshots"
ON public.x_account_metric_snapshots
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Existing connected accounts cannot be reconstructed historically, but this
-- marks them as already present before live metric capture was introduced.
INSERT INTO public.x_account_metric_snapshots (
  user_id,
  x_account_id,
  x_user_id,
  username,
  account_role,
  snapshot_type,
  captured_at
)
SELECT
  account.user_id,
  account.id,
  account.x_user_id,
  account.username,
  account.account_role,
  'backfill',
  NOW()
FROM public.x_accounts account
WHERE NOT EXISTS (
  SELECT 1
  FROM public.x_account_metric_snapshots snapshot
  WHERE snapshot.x_account_id = account.id
);
