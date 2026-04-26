-- Voice call records. One row per LiveKit voice session with the agent.
-- summary is the model-generated recap used for cross-call continuity.
-- full_transcript is the raw turn-by-turn for debugging / future fine-tuning.

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  summary text,
  full_transcript text,
  status text not null default 'active' -- 'active' | 'completed' | 'failed'
);

create index if not exists calls_user_started_idx
  on calls (user_id, started_at desc);

alter table calls enable row level security;

-- Owner can read their own calls; writes go through the service role from
-- the agent worker, so no insert/update policy for end users.
create policy if not exists "calls_select_own"
  on calls for select
  using (auth.uid() = user_id);
