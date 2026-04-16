ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can view own or public templates" ON public.templates;

CREATE POLICY "Users can view own or public templates"
ON public.templates
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own templates" ON public.templates;
CREATE POLICY "Users can insert own templates"
ON public.templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
CREATE POLICY "Users can update own templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
CREATE POLICY "Users can delete own templates"
ON public.templates
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
