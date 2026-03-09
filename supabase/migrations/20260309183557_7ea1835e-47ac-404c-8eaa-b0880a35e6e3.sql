
-- research_sources: add missing fields
ALTER TABLE public.research_sources
  ADD COLUMN IF NOT EXISTS source_category text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS accessed_date text,
  ADD COLUMN IF NOT EXISTS linked_sections jsonb,
  ADD COLUMN IF NOT EXISTS linked_team_member_names jsonb,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- data_room_items: add missing workflow fields
ALTER TABLE public.data_room_items
  ADD COLUMN IF NOT EXISTS received_date text,
  ADD COLUMN IF NOT EXISTS is_reviewed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewer_notes text;

-- report_sections: add module_key for join
ALTER TABLE public.report_sections
  ADD COLUMN IF NOT EXISTS module_key text;

-- engagement_case_studies: new table
CREATE TABLE IF NOT EXISTS public.engagement_case_studies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  sector text,
  investment_thesis text,
  engagement_outcomes jsonb,
  outcome_status text,
  assessment_rating text,
  assessment_detail text,
  market_validation text,
  order_index integer
);
