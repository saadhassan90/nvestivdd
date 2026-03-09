CREATE TABLE public.research_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  source_type text DEFAULT 'web',
  favicon_url text,
  added_at timestamp with time zone NOT NULL DEFAULT now()
);