ALTER TABLE public.seven_day_planning_items
ADD COLUMN IF NOT EXISTS core_claim TEXT;

UPDATE public.seven_day_planning_items
SET core_claim = COALESCE(NULLIF(btrim(core_claim), ''), NULLIF(btrim(angle), ''))
WHERE core_claim IS NULL OR btrim(core_claim) = '';
