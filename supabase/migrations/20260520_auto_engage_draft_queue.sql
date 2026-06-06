-- Migration: Auto Engage draft-only profiles, targets, and daily suggestion queue

CREATE TABLE IF NOT EXISTS public.auto_engage_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_account_id UUID NOT NULL REFERENCES public.x_accounts(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  primary_goal TEXT NOT NULL DEFAULT 'founder_personal_branding',
  niche TEXT,
  offer TEXT,
  target_audience TEXT,
  brand_voice TEXT,
  content_pillars TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  topics_to_avoid TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  daily_limit INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auto_engage_profiles_goal_check CHECK (
    primary_goal IN ('founder_personal_branding', 'lead_generation', 'community_engagement')
  ),
  CONSTRAINT auto_engage_profiles_daily_limit_check CHECK (daily_limit BETWEEN 1 AND 25)
);

CREATE UNIQUE INDEX IF NOT EXISTS auto_engage_profiles_user_x_account_unique_idx
  ON public.auto_engage_profiles(user_id, x_account_id);

CREATE INDEX IF NOT EXISTS auto_engage_profiles_user_id_idx
  ON public.auto_engage_profiles(user_id);

CREATE INDEX IF NOT EXISTS auto_engage_profiles_x_account_id_idx
  ON public.auto_engage_profiles(x_account_id);

DROP TRIGGER IF EXISTS auto_engage_profiles_set_updated_at ON public.auto_engage_profiles;
CREATE TRIGGER auto_engage_profiles_set_updated_at
BEFORE UPDATE ON public.auto_engage_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.auto_engage_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own auto engage profiles" ON public.auto_engage_profiles;
CREATE POLICY "Users can view own auto engage profiles"
ON public.auto_engage_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own auto engage profiles" ON public.auto_engage_profiles;
CREATE POLICY "Users can insert own auto engage profiles"
ON public.auto_engage_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own auto engage profiles" ON public.auto_engage_profiles;
CREATE POLICY "Users can update own auto engage profiles"
ON public.auto_engage_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own auto engage profiles" ON public.auto_engage_profiles;
CREATE POLICY "Users can delete own auto engage profiles"
ON public.auto_engage_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.auto_engage_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.auto_engage_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auto_engage_targets_type_check CHECK (target_type IN ('account', 'keyword'))
);

CREATE UNIQUE INDEX IF NOT EXISTS auto_engage_targets_profile_type_value_unique_idx
  ON public.auto_engage_targets(profile_id, target_type, lower(value));

CREATE INDEX IF NOT EXISTS auto_engage_targets_profile_id_idx
  ON public.auto_engage_targets(profile_id);

CREATE INDEX IF NOT EXISTS auto_engage_targets_user_id_idx
  ON public.auto_engage_targets(user_id);

DROP TRIGGER IF EXISTS auto_engage_targets_set_updated_at ON public.auto_engage_targets;
CREATE TRIGGER auto_engage_targets_set_updated_at
BEFORE UPDATE ON public.auto_engage_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.auto_engage_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own auto engage targets" ON public.auto_engage_targets;
CREATE POLICY "Users can view own auto engage targets"
ON public.auto_engage_targets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own auto engage targets" ON public.auto_engage_targets;
CREATE POLICY "Users can insert own auto engage targets"
ON public.auto_engage_targets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own auto engage targets" ON public.auto_engage_targets;
CREATE POLICY "Users can update own auto engage targets"
ON public.auto_engage_targets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own auto engage targets" ON public.auto_engage_targets;
CREATE POLICY "Users can delete own auto engage targets"
ON public.auto_engage_targets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.auto_engage_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.auto_engage_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_account_id UUID NOT NULL REFERENCES public.x_accounts(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_value TEXT,
  x_post_id TEXT NOT NULL,
  x_post_author_id TEXT,
  x_post_author_username TEXT NOT NULL,
  x_post_author_name TEXT,
  x_post_text TEXT NOT NULL,
  x_post_created_at TIMESTAMPTZ,
  x_post_url TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  suggested_reply TEXT NOT NULL,
  reply_options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  surfaced_for_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auto_engage_suggestions_source_type_check CHECK (
    source_type IN ('account', 'keyword', 'mention', 'home')
  ),
  CONSTRAINT auto_engage_suggestions_risk_level_check CHECK (
    risk_level IN ('low', 'medium', 'avoid')
  ),
  CONSTRAINT auto_engage_suggestions_status_check CHECK (
    status IN ('pending', 'copied', 'skipped', 'posted')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS auto_engage_suggestions_daily_post_unique_idx
  ON public.auto_engage_suggestions(profile_id, x_post_id, surfaced_for_date);

CREATE INDEX IF NOT EXISTS auto_engage_suggestions_profile_date_idx
  ON public.auto_engage_suggestions(profile_id, surfaced_for_date DESC, score DESC);

CREATE INDEX IF NOT EXISTS auto_engage_suggestions_user_id_idx
  ON public.auto_engage_suggestions(user_id);

CREATE INDEX IF NOT EXISTS auto_engage_suggestions_status_idx
  ON public.auto_engage_suggestions(status, surfaced_for_date DESC);

DROP TRIGGER IF EXISTS auto_engage_suggestions_set_updated_at ON public.auto_engage_suggestions;
CREATE TRIGGER auto_engage_suggestions_set_updated_at
BEFORE UPDATE ON public.auto_engage_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.auto_engage_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own auto engage suggestions" ON public.auto_engage_suggestions;
CREATE POLICY "Users can view own auto engage suggestions"
ON public.auto_engage_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own auto engage suggestions" ON public.auto_engage_suggestions;
CREATE POLICY "Users can insert own auto engage suggestions"
ON public.auto_engage_suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own auto engage suggestions" ON public.auto_engage_suggestions;
CREATE POLICY "Users can update own auto engage suggestions"
ON public.auto_engage_suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own auto engage suggestions" ON public.auto_engage_suggestions;
CREATE POLICY "Users can delete own auto engage suggestions"
ON public.auto_engage_suggestions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
