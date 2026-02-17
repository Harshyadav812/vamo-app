-- 008: offers table (AI valuation offers)

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  low_range integer not null,
  high_range integer not null,
  reasoning text not null,
  signals jsonb not null default '{}',
  expired boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

-- Users can read their own offers
create policy "Users can read own offers"
  on public.offers for select
  using (auth.uid() = user_id);

-- Users can insert offers (via API)
create policy "Users can insert offers"
  on public.offers for insert
  with check (auth.uid() = user_id);

-- Users can update their own offers (to mark expired)
create policy "Users can update own offers"
  on public.offers for update
  using (auth.uid() = user_id);
