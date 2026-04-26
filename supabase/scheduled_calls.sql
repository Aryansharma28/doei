-- Scheduled follow-up calls. Source of truth for "next call is X" in the app.
-- Google Calendar holds the user-facing event (and does the reminders for free).
-- This table mirrors the booking so the dashboard can show upcoming calls
-- without a Google round-trip on every render.

create table if not exists scheduled_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scheduled_for timestamptz not null,
  google_event_id text,
  cadence text not null default 'weekly', -- 'once' | 'weekly'
  status text not null default 'scheduled', -- 'scheduled' | 'completed' | 'cancelled'
  created_at timestamptz not null default now()
);

create index if not exists scheduled_calls_user_idx
  on scheduled_calls (user_id, scheduled_for desc);

alter table scheduled_calls enable row level security;

create policy if not exists "scheduled_calls_select_own"
  on scheduled_calls for select
  using (auth.uid() = user_id);
