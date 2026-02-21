-- 015: add project urls

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text;
