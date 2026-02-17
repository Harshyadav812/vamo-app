-- 002: projects table

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  url text,
  why_built text,
  progress_score integer not null default 0,
  listed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Owner can do everything with their own projects
create policy "Owners can manage own projects"
  on public.projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Anyone can view listed projects (for marketplace)
create policy "Anyone can view listed projects"
  on public.projects for select
  using (listed = true);

-- Admins can read all projects
create policy "Admins can read all projects"
  on public.projects for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.update_updated_at();
