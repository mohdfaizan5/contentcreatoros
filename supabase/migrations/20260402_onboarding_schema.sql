-- Migration: Schema-driven onboarding questions and answers
-- Supports reusable onboarding flows with stable question keys and per-user answers

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.onboarding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_key TEXT NOT NULL,
  step_id TEXT NOT NULL,
  step_title TEXT NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  question_key TEXT NOT NULL,
  question_label TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  question_type TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_key TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES public.onboarding_questions(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  answer JSONB NOT NULL DEFAULT 'null'::jsonb,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_questions_flow_question_key_idx
  ON public.onboarding_questions(flow_key, question_key);

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_answers_user_flow_question_key_idx
  ON public.onboarding_answers(user_id, flow_key, question_key);

CREATE INDEX IF NOT EXISTS onboarding_questions_flow_step_order_idx
  ON public.onboarding_questions(flow_key, step_order, question_order);

CREATE INDEX IF NOT EXISTS onboarding_answers_user_flow_idx
  ON public.onboarding_answers(user_id, flow_key);

DROP TRIGGER IF EXISTS onboarding_questions_set_updated_at ON public.onboarding_questions;
CREATE TRIGGER onboarding_questions_set_updated_at
BEFORE UPDATE ON public.onboarding_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS onboarding_answers_set_updated_at ON public.onboarding_answers;
CREATE TRIGGER onboarding_answers_set_updated_at
BEFORE UPDATE ON public.onboarding_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read onboarding questions" ON public.onboarding_questions;
CREATE POLICY "Authenticated users can read onboarding questions"
ON public.onboarding_questions
FOR SELECT
TO authenticated
USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users can insert onboarding questions" ON public.onboarding_questions;
CREATE POLICY "Authenticated users can insert onboarding questions"
ON public.onboarding_questions
FOR INSERT
TO authenticated
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Authenticated users can update onboarding questions" ON public.onboarding_questions;
CREATE POLICY "Authenticated users can update onboarding questions"
ON public.onboarding_questions
FOR UPDATE
TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can read their onboarding answers" ON public.onboarding_answers;
CREATE POLICY "Users can read their onboarding answers"
ON public.onboarding_answers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their onboarding answers" ON public.onboarding_answers;
CREATE POLICY "Users can insert their onboarding answers"
ON public.onboarding_answers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their onboarding answers" ON public.onboarding_answers;
CREATE POLICY "Users can update their onboarding answers"
ON public.onboarding_answers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their onboarding answers" ON public.onboarding_answers;
CREATE POLICY "Users can delete their onboarding answers"
ON public.onboarding_answers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
