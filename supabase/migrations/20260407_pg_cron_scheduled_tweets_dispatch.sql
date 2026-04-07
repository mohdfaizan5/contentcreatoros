-- Migration: switch scheduled tweet dispatch to pg_cron + pg_net

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'supabase_vault'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS supabase_vault';
  ELSIF EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'vault'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS vault';
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.runtime_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

REVOKE ALL ON TABLE private.runtime_secrets FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.get_vault_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  secret_value TEXT;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NOT NULL THEN
    EXECUTE 'SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = $1 LIMIT 1'
      INTO secret_value
      USING secret_name;
  END IF;

  IF secret_value IS NULL THEN
    SELECT value
    INTO secret_value
    FROM private.runtime_secrets
    WHERE name = secret_name
    LIMIT 1;
  END IF;

  RETURN secret_value;
END;
$$;

REVOKE ALL ON FUNCTION private.get_vault_secret(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.set_runtime_secret(secret_name text, secret_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private
AS $$
BEGIN
  INSERT INTO private.runtime_secrets (name, value, updated_at)
  VALUES (secret_name, secret_value, NOW())
  ON CONFLICT (name)
  DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION private.set_runtime_secret(text, text) FROM PUBLIC;

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
BEGIN
  app_base_url := private.get_vault_secret('app_base_url');
  cron_secret := private.get_vault_secret('app_cron_secret');

  IF app_base_url IS NULL OR btrim(app_base_url) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_base_url". Set it in Vault or private.runtime_secrets before pg_cron can dispatch scheduled tweets.';
  END IF;

  IF cron_secret IS NULL OR btrim(cron_secret) = '' THEN
    RAISE EXCEPTION 'Missing secret "app_cron_secret". Set it in Vault or private.runtime_secrets before pg_cron can dispatch scheduled tweets.';
  END IF;

  dispatch_url := rtrim(app_base_url, '/') || '/api/x/scheduled/dispatch';

  PERFORM net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cron_secret
    ),
    body := jsonb_build_object('source', 'pg_cron')::jsonb,
    timeout_milliseconds := 15000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_scheduled_tweets_job() FROM PUBLIC;

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
