
CREATE TABLE public.analysis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  step_label text NOT NULL,
  step_index integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 13,
  status text NOT NULL DEFAULT 'pending',
  detail text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on analysis_logs"
ON public.analysis_logs FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert on analysis_logs"
ON public.analysis_logs FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public update on analysis_logs"
ON public.analysis_logs FOR UPDATE TO public USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_logs;

CREATE INDEX idx_analysis_logs_project_id ON public.analysis_logs(project_id);
