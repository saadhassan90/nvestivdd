
-- ODD Workspace tables (ADIA variant)

CREATE TABLE public.odd_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE,
  content_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_markdown text NOT NULL DEFAULT '',
  risk_rating text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.odd_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on odd_reports"
  ON public.odd_reports FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_odd_reports_updated_at
  BEFORE UPDATE ON public.odd_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.odd_section_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  section_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  content_markdown text,
  verification_status text,
  flag_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, section_key)
);

ALTER TABLE public.odd_section_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on odd_section_results"
  ON public.odd_section_results FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_odd_section_results_updated_at
  BEFORE UPDATE ON public.odd_section_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_odd_section_results_project ON public.odd_section_results(project_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.odd_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.odd_section_results;
