-- Migration: support workflow thread replies and generated tweet reply chains

ALTER TABLE public.seven_day_planning_items
ADD COLUMN IF NOT EXISTS thread_replies jsonb NOT NULL DEFAULT '[]'::jsonb
CHECK (jsonb_typeof(thread_replies) = 'array'::text);

ALTER TABLE public.generated_tweets
ADD COLUMN IF NOT EXISTS reply_to_generated_tweet_id uuid
REFERENCES public.generated_tweets(id);

CREATE INDEX IF NOT EXISTS generated_tweets_reply_to_generated_tweet_id_idx
ON public.generated_tweets(reply_to_generated_tweet_id);
