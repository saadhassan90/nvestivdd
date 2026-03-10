CREATE TABLE public.pipeline_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_key text NOT NULL,
  output_text text NOT NULL,
  char_count integer NOT NULL DEFAULT 0,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, phase_key)
);

ALTER TABLE public.pipeline_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on pipeline_cache" ON public.pipeline_cache
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE INDEX idx_pipeline_cache_project ON public.pipeline_cache(project_id);