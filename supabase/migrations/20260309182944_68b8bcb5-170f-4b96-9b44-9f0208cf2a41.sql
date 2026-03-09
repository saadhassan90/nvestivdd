
-- =============================================
-- 1. ALTER existing tables with new columns
-- =============================================

-- projects: add new fields from expanded schema
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS strategy text,
  ADD COLUMN IF NOT EXISTS completeness_score integer,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS fund_size_estimated text,
  ADD COLUMN IF NOT EXISTS fund_inception_date text,
  ADD COLUMN IF NOT EXISTS gp_entity_name text,
  ADD COLUMN IF NOT EXISTS domicile text,
  ADD COLUMN IF NOT EXISTS regulatory_status text,
  ADD COLUMN IF NOT EXISTS analysis_date text,
  ADD COLUMN IF NOT EXISTS executive_summary_narrative text,
  ADD COLUMN IF NOT EXISTS key_strengths jsonb,
  ADD COLUMN IF NOT EXISTS key_risks jsonb,
  ADD COLUMN IF NOT EXISTS market_validation_points jsonb,
  ADD COLUMN IF NOT EXISTS conditions_for_advancement jsonb,
  ADD COLUMN IF NOT EXISTS recommended_timeline text,
  ADD COLUMN IF NOT EXISTS final_assessment_narrative text;

-- red_flags: add structured fields
ALTER TABLE public.red_flags
  ADD COLUMN IF NOT EXISTS flag_number integer,
  ADD COLUMN IF NOT EXISTS issue text,
  ADD COLUMN IF NOT EXISTS implication text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS timeline text,
  ADD COLUMN IF NOT EXISTS source_module text,
  ADD COLUMN IF NOT EXISTS related_interrogatory_ids jsonb,
  ADD COLUMN IF NOT EXISTS related_data_room_ids jsonb,
  ADD COLUMN IF NOT EXISTS order_index integer;

-- interrogatory_items: add GP response tracking + source info
ALTER TABLE public.interrogatory_items
  ADD COLUMN IF NOT EXISTS source_module text,
  ADD COLUMN IF NOT EXISTS source_module_label text,
  ADD COLUMN IF NOT EXISTS gp_response_score integer,
  ADD COLUMN IF NOT EXISTS gp_response_notes text,
  ADD COLUMN IF NOT EXISTS related_red_flag_ids jsonb;

-- data_room_items: add priority_tier, priority_label, sub_items, source_module
ALTER TABLE public.data_room_items
  ADD COLUMN IF NOT EXISTS priority_tier integer,
  ADD COLUMN IF NOT EXISTS priority_label text,
  ADD COLUMN IF NOT EXISTS sub_items jsonb,
  ADD COLUMN IF NOT EXISTS source_module text;

-- documents: add classification fields from Node 0
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS document_type_classified text,
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS document_date text,
  ADD COLUMN IF NOT EXISTS classification_confidence text,
  ADD COLUMN IF NOT EXISTS quality_notes text;

-- research_sources: add citation_id for cross-referencing
ALTER TABLE public.research_sources
  ADD COLUMN IF NOT EXISTS citation_id text;

-- =============================================
-- 2. CREATE new tables
-- =============================================

-- module_scores: separate table for per-module scoring
CREATE TABLE IF NOT EXISTS public.module_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  module_label text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  confidence text,
  weight numeric(4,2),
  weighted_score numeric(6,2),
  confidence_rationale text,
  summary_assessment text,
  order_index integer
);

-- team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  role_category text,
  years_experience integer,
  prior_affiliations jsonb,
  education text,
  verification_status text NOT NULL DEFAULT 'unverified',
  verification_detail text,
  verification_citation_ids jsonb,
  is_key_person boolean NOT NULL DEFAULT false,
  adverse_findings text,
  adverse_finding_severity text,
  assessment_rating text,
  order_index integer
);

-- performance_metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  fund_name text NOT NULL,
  metric_name text NOT NULL,
  metric_category text NOT NULL,
  value text NOT NULL,
  value_numeric numeric,
  benchmark_name text,
  benchmark_value text,
  benchmark_value_numeric numeric,
  alpha text,
  as_of_date text,
  citation_ids jsonb,
  order_index integer
);

-- fee_structure
CREATE TABLE IF NOT EXISTS public.fee_structure (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  share_class text NOT NULL,
  component text NOT NULL,
  value text NOT NULL,
  asset_class_norm text,
  assessment text,
  assessment_detail text,
  is_disclosed boolean NOT NULL DEFAULT true,
  order_index integer
);

-- thesis_validations
CREATE TABLE IF NOT EXISTS public.thesis_validations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  claim text NOT NULL,
  claim_source text,
  validation_status text NOT NULL,
  confidence text NOT NULL,
  validation_detail text,
  citation_ids jsonb,
  order_index integer
);

-- competitive_landscape
CREATE TABLE IF NOT EXISTS public.competitive_landscape (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  competitor_type text NOT NULL,
  aum text,
  strategy_description text,
  differentiation_vs_fund text,
  competitive_assessment text,
  citation_ids jsonb,
  order_index integer
);

-- market_factors
CREATE TABLE IF NOT EXISTS public.market_factors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  factor_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  confidence text NOT NULL,
  time_horizon text,
  supporting_data text,
  citation_ids jsonb,
  order_index integer
);

-- service_providers
CREATE TABLE IF NOT EXISTS public.service_providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider_type text NOT NULL,
  provider_name text,
  is_disclosed boolean NOT NULL DEFAULT false,
  is_verified boolean,
  verification_detail text,
  importance text NOT NULL DEFAULT 'standard',
  notes text
);

-- submission_quality
CREATE TABLE IF NOT EXISTS public.submission_quality (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  category_label text NOT NULL,
  status text NOT NULL,
  confidence text NOT NULL,
  severity text NOT NULL DEFAULT 'none',
  order_index integer
);

-- document_quality_flags
CREATE TABLE IF NOT EXISTS public.document_quality_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  flag_key text NOT NULL,
  flag_label text NOT NULL,
  rating text NOT NULL,
  assessment text NOT NULL
);

-- critical_info_gaps
CREATE TABLE IF NOT EXISTS public.critical_info_gaps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  gap_title text NOT NULL,
  gap_description text NOT NULL,
  severity text NOT NULL,
  related_module text,
  order_index integer
);
