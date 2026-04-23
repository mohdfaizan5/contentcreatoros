-- Migration: store question importance so onboarding can run important-first.

ALTER TABLE public.onboarding_questions
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS onboarding_questions_flow_important_idx
  ON public.onboarding_questions(flow_key, is_important);
