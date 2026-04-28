DELETE FROM public.report_sections a
USING public.report_sections b
WHERE a.project_id = b.project_id
  AND a.section_key = b.section_key
  AND (a.created_at, a.id) < (b.created_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS report_sections_project_section_key_unique
  ON public.report_sections (project_id, section_key);