-- Migration: media attachments for workflow posts and scheduled X publishing

ALTER TABLE public.seven_day_planning_items
ADD COLUMN IF NOT EXISTS media_attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.generated_tweets
ADD COLUMN IF NOT EXISTS media_attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.seven_day_planning_items
DROP CONSTRAINT IF EXISTS seven_day_planning_items_day_index_check;

ALTER TABLE public.seven_day_planning_items
ADD CONSTRAINT seven_day_planning_items_day_index_check
CHECK (day_index BETWEEN 0 AND 13);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seven_day_planning_items_media_attachments_array_check'
  ) THEN
    ALTER TABLE public.seven_day_planning_items
    ADD CONSTRAINT seven_day_planning_items_media_attachments_array_check
    CHECK (jsonb_typeof(media_attachments) = 'array');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'generated_tweets_media_attachments_array_check'
  ) THEN
    ALTER TABLE public.generated_tweets
    ADD CONSTRAINT generated_tweets_media_attachments_array_check
    CHECK (jsonb_typeof(media_attachments) = 'array');
  END IF;
END
$$;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'post-media',
  'post-media',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

DROP POLICY IF EXISTS "Users can view own post media" ON storage.objects;
CREATE POLICY "Users can view own post media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can upload own post media" ON storage.objects;
CREATE POLICY "Users can upload own post media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can update own post media" ON storage.objects;
CREATE POLICY "Users can update own post media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

DROP POLICY IF EXISTS "Users can delete own post media" ON storage.objects;
CREATE POLICY "Users can delete own post media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
