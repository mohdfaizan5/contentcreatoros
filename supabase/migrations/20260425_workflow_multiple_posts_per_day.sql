-- Migration: allow separate workflow planner items for multiple posts on the same day

ALTER TABLE public.seven_day_planning_items
DROP CONSTRAINT IF EXISTS seven_day_planning_items_run_item_date_key;

ALTER TABLE public.seven_day_planning_items
DROP CONSTRAINT IF EXISTS seven_day_planning_items_day_index_check;

ALTER TABLE public.seven_day_planning_items
ADD CONSTRAINT seven_day_planning_items_day_index_check
CHECK (day_index BETWEEN 0 AND 27);
