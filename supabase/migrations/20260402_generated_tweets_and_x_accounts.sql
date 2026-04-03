-- Migration: generated tweets and persistent X connections for scheduled publishing

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.x_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT[] DEFAULT ARRAY[]::TEXT[],
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  x_account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  character_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  x_tweet_id TEXT,
  error_message TEXT,
  model TEXT,
  prompt_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT generated_tweets_status_check CHECK (
    status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS x_accounts_user_id_idx
  ON public.x_accounts(user_id);

CREATE INDEX IF NOT EXISTS generated_tweets_user_id_idx
  ON public.generated_tweets(user_id);

CREATE INDEX IF NOT EXISTS generated_tweets_template_id_idx
  ON public.generated_tweets(template_id);

CREATE INDEX IF NOT EXISTS generated_tweets_status_scheduled_for_idx
  ON public.generated_tweets(status, scheduled_for);

DROP TRIGGER IF EXISTS x_accounts_set_updated_at ON public.x_accounts;
CREATE TRIGGER x_accounts_set_updated_at
BEFORE UPDATE ON public.x_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS generated_tweets_set_updated_at ON public.generated_tweets;
CREATE TRIGGER generated_tweets_set_updated_at
BEFORE UPDATE ON public.generated_tweets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.x_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_tweets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own x accounts" ON public.x_accounts;
CREATE POLICY "Users can view own x accounts"
ON public.x_accounts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own x accounts" ON public.x_accounts;
CREATE POLICY "Users can insert own x accounts"
ON public.x_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own x accounts" ON public.x_accounts;
CREATE POLICY "Users can update own x accounts"
ON public.x_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own x accounts" ON public.x_accounts;
CREATE POLICY "Users can delete own x accounts"
ON public.x_accounts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own generated tweets" ON public.generated_tweets;
CREATE POLICY "Users can view own generated tweets"
ON public.generated_tweets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own generated tweets" ON public.generated_tweets;
CREATE POLICY "Users can insert own generated tweets"
ON public.generated_tweets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own generated tweets" ON public.generated_tweets;
CREATE POLICY "Users can update own generated tweets"
ON public.generated_tweets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own generated tweets" ON public.generated_tweets;
CREATE POLICY "Users can delete own generated tweets"
ON public.generated_tweets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
