create extension if not exists pgcrypto;

create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  google_email text,
  refresh_token text not null,
  access_token text,
  status text not null default 'connected',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.gmail_connections enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_gmail_connections_updated_at on public.gmail_connections;

create trigger set_gmail_connections_updated_at
before update on public.gmail_connections
for each row
execute function public.set_updated_at();
