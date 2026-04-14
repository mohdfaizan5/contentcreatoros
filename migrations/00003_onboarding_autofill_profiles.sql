-- Onboarding autofill profile persistence
-- Stores scraped website payload, inferred onboarding answers, and brand identity
-- for each user so prefill runs are auditable and repeatable.

CREATE TABLE IF NOT EXISTS onboarding_autofill_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_key TEXT NOT NULL DEFAULT 'x_content_strategy_v2',
  source_url TEXT NOT NULL,
  source_domain TEXT,
  x_handle TEXT,
  scrape_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  inferred_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT,
  prompt_version TEXT,
  run_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT onboarding_autofill_profiles_source_url_not_empty CHECK (char_length(trim(source_url)) > 0)
);

CREATE INDEX IF NOT EXISTS onboarding_autofill_profiles_user_flow_idx
  ON onboarding_autofill_profiles(user_id, flow_key);

CREATE INDEX IF NOT EXISTS onboarding_autofill_profiles_source_domain_idx
  ON onboarding_autofill_profiles(source_domain);

CREATE INDEX IF NOT EXISTS onboarding_autofill_profiles_brand_identity_gin_idx
  ON onboarding_autofill_profiles USING GIN (brand_identity);

CREATE INDEX IF NOT EXISTS onboarding_autofill_profiles_inferred_answers_gin_idx
  ON onboarding_autofill_profiles USING GIN (inferred_answers);

ALTER TABLE onboarding_autofill_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding autofill profiles" ON onboarding_autofill_profiles;
CREATE POLICY "Users can view own onboarding autofill profiles"
  ON onboarding_autofill_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding autofill profiles" ON onboarding_autofill_profiles;
CREATE POLICY "Users can insert own onboarding autofill profiles"
  ON onboarding_autofill_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding autofill profiles" ON onboarding_autofill_profiles;
CREATE POLICY "Users can update own onboarding autofill profiles"
  ON onboarding_autofill_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own onboarding autofill profiles" ON onboarding_autofill_profiles;
CREATE POLICY "Users can delete own onboarding autofill profiles"
  ON onboarding_autofill_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS onboarding_autofill_profiles_set_updated_at ON onboarding_autofill_profiles;
CREATE TRIGGER onboarding_autofill_profiles_set_updated_at
BEFORE UPDATE ON onboarding_autofill_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
