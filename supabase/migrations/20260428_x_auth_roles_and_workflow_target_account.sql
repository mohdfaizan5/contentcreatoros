-- Migration: role-based X connections for founder/company publishing

ALTER TABLE public.x_accounts
  ADD COLUMN IF NOT EXISTS account_role TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'x_accounts_account_role_check'
  ) THEN
    ALTER TABLE public.x_accounts
      ADD CONSTRAINT x_accounts_account_role_check
      CHECK (account_role IN ('founder', 'company') OR account_role IS NULL);
  END IF;
END
$$;

ALTER TABLE public.x_accounts
  DROP CONSTRAINT IF EXISTS x_accounts_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS x_accounts_user_role_unique_idx
  ON public.x_accounts(user_id, account_role);

CREATE UNIQUE INDEX IF NOT EXISTS x_accounts_user_x_user_id_unique_idx
  ON public.x_accounts(user_id, x_user_id);

ALTER TABLE public.seven_day_planning_runs
  ADD COLUMN IF NOT EXISTS target_x_account_id UUID REFERENCES public.x_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS seven_day_planning_runs_target_x_account_id_idx
  ON public.seven_day_planning_runs(target_x_account_id);
