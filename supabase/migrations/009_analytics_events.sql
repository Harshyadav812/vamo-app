-- 009: analytics_events table

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_name text not null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

-- Authenticated users can insert their own events
create policy "Users can insert own analytics"
  on public.analytics_events for insert
  with check (auth.uid() = user_id);

-- Admins can read all analytics
create policy "Admins can read all analytics"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
