-- Migration: add_collaborators_table
-- Description: Adds a collaborators table to link profiles to projects with specific roles

create table collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')) default 'editor',
  added_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

-- Enable RLS
alter table collaborators enable row level security;

-- Policies
create policy "Collaborators are viewable by project team and admins"
  on collaborators for select
  using (
    -- User is admin
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or
    -- User is part of this project
    exists (
      select 1 from collaborators c2
      where c2.project_id = collaborators.project_id
      and c2.user_id = auth.uid()
    )
    or
    -- User is the project owner
    exists (
      select 1 from projects p
      where p.id = collaborators.project_id
      and p.owner_id = auth.uid()
    )
  );

create policy "Collaborators can be added by project owner or project admins"
  on collaborators for insert
  with check (
    -- User is admin
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or
    -- User is the project owner
    exists (
      select 1 from projects p
      where p.id = collaborators.project_id
      and p.owner_id = auth.uid()
    )
    or
    -- User is an admin of this project
    exists (
      select 1 from collaborators c2
      where c2.project_id = collaborators.project_id
      and c2.user_id = auth.uid()
      and c2.role in ('owner', 'admin')
    )
  );

create policy "Collaborators can be updated by project owner or project admins"
  on collaborators for update
  using (
    -- User is admin
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or
    -- User is the project owner
    exists (
      select 1 from projects p
      where p.id = collaborators.project_id
      and p.owner_id = auth.uid()
    )
    or
    -- User is an admin of this project
    exists (
      select 1 from collaborators c2
      where c2.project_id = collaborators.project_id
      and c2.user_id = auth.uid()
      and c2.role in ('owner', 'admin')
    )
  );

create policy "Collaborators can be deleted by project owner or project admins"
  on collaborators for delete
  using (
    -- User is admin
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    or
    -- User is the project owner
    exists (
      select 1 from projects p
      where p.id = collaborators.project_id
      and p.owner_id = auth.uid()
    )
    or
    -- User is an admin of this project
    exists (
      select 1 from collaborators c2
      where c2.project_id = collaborators.project_id
      and c2.user_id = auth.uid()
      and c2.role in ('owner', 'admin')
    )
    or
    -- User is removing themselves
    collaborators.user_id = auth.uid()
  );

-- Function to handle an invite by email
-- Since we do not have an invitations table yet, we can do a simple lookup
-- by email on the profiles table. If the profile exists, add them directly.
-- If the profile does not exist, return an error currently.
create or replace function invite_collaborator_by_email(
  p_project_id uuid,
  p_email text,
  p_role text default 'editor'
) returns json language plpgsql security definer as $$
declare
  v_user_id uuid;
  v_caller_id uuid := auth.uid();
  v_is_authorized boolean;
begin
  -- Check auth
  if v_caller_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Check if caller is authorized
  select exists (
    select 1 from projects p where p.id = p_project_id and p.owner_id = v_caller_id
    union
    select 1 from collaborators c where c.project_id = p_project_id and c.user_id = v_caller_id and c.role in ('owner', 'admin')
    union
    select 1 from profiles pr where pr.id = v_caller_id and pr.is_admin = true
  ) into v_is_authorized;

  if not v_is_authorized then
    return json_build_object('success', false, 'error', 'Not authorized to invite collaborators');
  end if;

  -- Find the user by email in the profiles table
  select id into v_user_id from profiles where email = p_email;

  if v_user_id is null then
    return json_build_object('success', false, 'error', 'No user found with this email. They must sign up first.');
  end if;

  -- Insert or update
  insert into collaborators (project_id, user_id, role, added_by)
  values (p_project_id, v_user_id, p_role, v_caller_id)
  on conflict (project_id, user_id) 
  do update set role = excluded.role;

  -- Log activity event (we can do this from the backend or here. Let's let the backend do it to include pineapples)

  return json_build_object('success', true, 'user_id', v_user_id);
end;
$$;
