-- Migration: admin_delist_rpc
-- Description: Creates a secure RPC function for admins to delist a project, bypassing RLS safely.

create or replace function admin_delist_project(
  p_listing_id uuid,
  p_reason text
) returns json language plpgsql security definer as $$
declare
  v_caller_id uuid := auth.uid();
  v_is_admin boolean;
  v_owner_id uuid;
  v_project_id uuid;
  v_title text;
begin
  -- Check auth
  if v_caller_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Verify the caller is an admin
  select is_admin into v_is_admin from profiles where id = v_caller_id;
  if not coalesce(v_is_admin, false) then
    return json_build_object('success', false, 'error', 'Not authorized -> user is not an admin');
  end if;

  -- Get listing details
  select owner_id, project_id, title into v_owner_id, v_project_id, v_title
  from listings 
  where id = p_listing_id;

  if v_project_id is null then
    return json_build_object('success', false, 'error', 'Listing not found');
  end if;

  -- Update the listing (bypasses RLS because security definer)
  update listings set status = 'withdrawn' where id = p_listing_id;

  -- Update the project
  update projects set listed = false where id = v_project_id;

  -- Insert the message if a reason was provided and caller is not the owner
  if p_reason is not null and p_reason != '' and v_owner_id != v_caller_id then
    insert into messages (project_id, role, content, pineapples_earned)
    values (
      v_project_id, 
      'assistant', 
      'Your project listing "' || v_title || '" has been removed from the marketplace by an administrator.' || E'\n\n' || 'Reason: ' || p_reason, 
      0
    );
  end if;

  return json_build_object('success', true);
end;
$$;
