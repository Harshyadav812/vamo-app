-- 003: messages table (chat history)

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tag text check (tag in ('feature', 'bug', 'improvement', 'milestone', 'general')),
  pineapples_earned integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Owner can read their project's messages
create policy "Owners can read project messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.projects
      where id = messages.project_id and owner_id = auth.uid()
    )
  );

-- Owner can insert messages to their project
create policy "Owners can insert project messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.projects
      where id = messages.project_id and owner_id = auth.uid()
    )
  );

-- Index for fast lookups by project
create index idx_messages_project_id on public.messages(project_id, created_at);
