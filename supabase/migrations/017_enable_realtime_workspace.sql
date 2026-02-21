-- 017: enable realtime for workspace tables

-- Enable replication for activity_events so the workspace UI can listen to new events
alter publication supabase_realtime add table public.activity_events;

-- Enable replication for profiles so the workspace UI can listen to pineapple balance updates
alter publication supabase_realtime add table public.profiles;

-- Ensure projects are still tracked
alter publication supabase_realtime add table public.projects;
