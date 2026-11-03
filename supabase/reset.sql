-- =====================================================================
-- STEP 1A: RESET. Deletes the old table and ALL its data (policies and indexes go with it).
-- =====================================================================

drop table if exists public.content_calendar cascade;
