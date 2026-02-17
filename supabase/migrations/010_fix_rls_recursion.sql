-- 010: Fix infinite recursion in RLS policies
-- The admin check policies on profiles/projects etc. query public.profiles,
-- which triggers RLS on profiles again, causing infinite recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS.

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$ language sql security definer stable;

-- ===== Profiles =====
drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- ===== Projects =====
drop policy if exists "Admins can read all projects" on public.projects;
create policy "Admins can read all projects"
  on public.projects for select
  using (public.is_admin());

-- ===== Activity Events =====
drop policy if exists "Admins can read all activity" on public.activity_events;
create policy "Admins can read all activity"
  on public.activity_events for select
  using (public.is_admin());

-- ===== Reward Ledger =====
drop policy if exists "Admins can read all rewards" on public.reward_ledger;
create policy "Admins can read all rewards"
  on public.reward_ledger for select
  using (public.is_admin());

-- ===== Redemptions =====
drop policy if exists "Admins can read all redemptions" on public.redemptions;
create policy "Admins can read all redemptions"
  on public.redemptions for select
  using (public.is_admin());

drop policy if exists "Admins can update redemptions" on public.redemptions;
create policy "Admins can update redemptions"
  on public.redemptions for update
  using (public.is_admin());

-- ===== Analytics Events =====
drop policy if exists "Admins can read all analytics" on public.analytics_events;
create policy "Admins can read all analytics"
  on public.analytics_events for select
  using (public.is_admin());
