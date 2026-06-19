
CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  raise_id text,
  section_key text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text,
  schema_type text NOT NULL DEFAULT 'markdown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_key, raise_id, section_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_content TO anon, authenticated;
GRANT ALL ON public.page_content TO service_role;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read page_content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "Public write page_content" ON public.page_content FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update page_content" ON public.page_content FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete page_content" ON public.page_content FOR DELETE USING (true);

CREATE TRIGGER trg_page_content_updated_at
BEFORE UPDATE ON public.page_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_page_content_page_key ON public.page_content(page_key, raise_id);

CREATE TABLE public.page_edit_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL,
  raise_id text,
  section_key text NOT NULL,
  label text,
  current_content jsonb,
  proposed_content jsonb NOT NULL,
  rationale text,
  status text NOT NULL DEFAULT 'pending',
  conversation_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_edit_proposals TO anon, authenticated;
GRANT ALL ON public.page_edit_proposals TO service_role;
ALTER TABLE public.page_edit_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read proposals" ON public.page_edit_proposals FOR SELECT USING (true);
CREATE POLICY "Public write proposals" ON public.page_edit_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update proposals" ON public.page_edit_proposals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete proposals" ON public.page_edit_proposals FOR DELETE USING (true);

CREATE TRIGGER trg_page_edit_proposals_updated_at
BEFORE UPDATE ON public.page_edit_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_proposals_page_key ON public.page_edit_proposals(page_key, raise_id, status);

ALTER PUBLICATION supabase_realtime ADD TABLE public.page_content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_edit_proposals;
