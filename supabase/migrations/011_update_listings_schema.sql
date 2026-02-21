-- 011: update listings table schema
-- Add columns for enhanced marketplace listings

alter table public.listings
  add column if not exists images text[] default '{}',
  add column if not exists metrics jsonb default '{}',
  add column if not exists allow_offers boolean default true;

-- Update interface comment:
-- metrics: { 
--   progress_score: number,
--   traction_events: number,
--   prompt_count: number,
--   snapshot_date: string 
-- }
