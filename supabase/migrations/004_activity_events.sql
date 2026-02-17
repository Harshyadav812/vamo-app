-- 004: activity_events table (append-only timeline)

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;

-- Owner can read their project's activity
create policy "Owners can read project activity"
  on public.activity_events for select
  using (auth.uid() = user_id);

-- Owner can insert activity (append-only: no UPDATE or DELETE policies)
create policy "Owners can insert activity"
  on public.activity_events for insert
  with check (auth.uid() = user_id);

-- Admins can read all activity
create policy "Admins can read all activity"
  on public.activity_events for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create index idx_activity_project_id on public.activity_events(project_id, created_at);
