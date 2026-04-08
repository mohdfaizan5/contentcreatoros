-- Migration: simplify onboarding_questions to keep only stable question identity

ALTER TABLE public.onboarding_questions
  ADD COLUMN IF NOT EXISTS question TEXT;

UPDATE public.onboarding_questions
SET question = COALESCE(question, question_label, question_key)
WHERE question IS NULL;

ALTER TABLE public.onboarding_questions
  ALTER COLUMN question SET NOT NULL;

DROP INDEX IF EXISTS onboarding_questions_flow_step_order_idx;

ALTER TABLE public.onboarding_questions
  DROP COLUMN IF EXISTS step_id,
  DROP COLUMN IF EXISTS step_title,
  DROP COLUMN IF EXISTS step_order,
  DROP COLUMN IF EXISTS question_label,
  DROP COLUMN IF EXISTS question_order,
  DROP COLUMN IF EXISTS question_type,
  DROP COLUMN IF EXISTS required,
  DROP COLUMN IF EXISTS config;
