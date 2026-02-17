-- 007: listings table (marketplace)

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  asking_price integer,
  status text not null default 'active' check (status in ('active', 'sold', 'withdrawn')),
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

-- Owners can manage their listings
create policy "Owners can manage own listings"
  on public.listings for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Anyone can view active listings (public marketplace)
create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active');
