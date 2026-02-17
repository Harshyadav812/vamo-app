-- 006: redemptions table

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount >= 50),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'failed')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

alter table public.redemptions enable row level security;

-- Users can read their own redemptions
create policy "Users can read own redemptions"
  on public.redemptions for select
  using (auth.uid() = user_id);

-- Users can insert redemptions
create policy "Users can insert redemptions"
  on public.redemptions for insert
  with check (auth.uid() = user_id);

-- Admins can read all redemptions
create policy "Admins can read all redemptions"
  on public.redemptions for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Admins can update redemption status
create policy "Admins can update redemptions"
  on public.redemptions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
