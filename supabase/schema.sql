-- =====================================================================
-- STEP 1B: FRESH SCHEMA. Run this right after the reset script.
-- =====================================================================

create table public.content_calendar (
  -- The database generates the id. The app never sends this key.
  id           uuid        primary key default gen_random_uuid(),

  requirement  text        not null default '',
  topic_idea   text        not null default '',
  assignee     text        not null default '',
  status       text        not null default 'Idea'
                           check (status in ('Idea', 'Drafting', 'In Review', 'Scheduled', 'Published')),
  target_date  date        not null default current_date,
  week_number  integer     not null check (week_number > 0),

  -- Keeps drag-and-drop row order inside a week.
  position     integer     not null default 0,
  created_at   timestamptz not null default now()
);

create index content_calendar_week_pos_idx
  on public.content_calendar (week_number, position);

-- Row Level Security
alter table public.content_calendar enable row level security;

-- DEVELOPMENT POLICY: anyone holding the anon key can read and write.
-- Replace with login-based rules before sharing the site publicly.
create policy "content_calendar_dev_all"
  on public.content_calendar
  for all
  to anon, authenticated
  using (true)
  with check (true);
