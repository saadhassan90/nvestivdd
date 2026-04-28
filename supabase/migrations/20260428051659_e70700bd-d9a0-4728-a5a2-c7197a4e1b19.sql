-- Phase 5 — Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  section_id text NOT NULL,                -- e.g. "investment_thesis", "team", "overview"
  sub_card_id text,                        -- optional finer anchor inside a section
  author_type text NOT NULL DEFAULT 'human' CHECK (author_type IN ('human','ai')),
  author_name text NOT NULL DEFAULT 'Anonymous',
  body_md text NOT NULL,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  resolved_at timestamptz,
  report_version integer NOT NULL DEFAULT 1,
  severity text,                           -- optional: critical / elevated / info — used for AI flags
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_project_section
  ON public.comments(project_id, section_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent
  ON public.comments(parent_comment_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access on comments"
  ON public.comments FOR ALL
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER TABLE public.comments REPLICA IDENTITY FULL;