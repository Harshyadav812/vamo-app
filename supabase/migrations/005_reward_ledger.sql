-- 005: reward_ledger table

create table public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  event_type text not null,
  amount integer not null,
  idempotency_key text unique not null,
  created_at timestamptz not null default now()
);

alter table public.reward_ledger enable row level security;

-- Users can read their own rewards
create policy "Users can read own rewards"
  on public.reward_ledger for select
  using (auth.uid() = user_id);

-- Users can insert rewards (through API)
create policy "Users can insert rewards"
  on public.reward_ledger for insert
  with check (auth.uid() = user_id);

-- Admins can read all rewards
create policy "Admins can read all rewards"
  on public.reward_ledger for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create index idx_reward_ledger_user_id on public.reward_ledger(user_id, created_at desc);
