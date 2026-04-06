ALTER TABLE public.templates
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.template_likes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT template_likes_pkey PRIMARY KEY (id),
    CONSTRAINT template_likes_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id) ON DELETE CASCADE,
    CONSTRAINT template_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT template_likes_user_template_unique UNIQUE (template_id, user_id)
);

CREATE INDEX IF NOT EXISTS template_likes_template_id_idx
    ON public.template_likes(template_id);

CREATE INDEX IF NOT EXISTS template_likes_user_id_idx
    ON public.template_likes(user_id);

ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view likes for visible templates" ON public.template_likes;
CREATE POLICY "Users can view likes for visible templates"
ON public.template_likes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.templates t
        WHERE t.id = template_likes.template_id
          AND (t.is_public = true OR t.user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can like visible templates" ON public.template_likes;
CREATE POLICY "Users can like visible templates"
ON public.template_likes
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1
        FROM public.templates t
        WHERE t.id = template_likes.template_id
          AND (t.is_public = true OR t.user_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can unlike their own likes" ON public.template_likes;
CREATE POLICY "Users can unlike their own likes"
ON public.template_likes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
