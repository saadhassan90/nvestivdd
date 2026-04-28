-- Phase 7 — Synthesis pipeline payload columns
-- Adds JSONB columns on `projects` for the new typed component payloads emitted by the synthesis extractors.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS sector_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS geography_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS market_context jsonb,
  ADD COLUMN IF NOT EXISTS esg_score numeric,
  ADD COLUMN IF NOT EXISTS esg_claims jsonb,
  ADD COLUMN IF NOT EXISTS esg_process_matrix jsonb,
  ADD COLUMN IF NOT EXISTS sfdr_classification text,
  ADD COLUMN IF NOT EXISTS impact_focus text;

-- Constrain ESG score to PRD's 1.0–4.0 range when present (nullable allowed).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_esg_score_range'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_esg_score_range
      CHECK (esg_score IS NULL OR (esg_score >= 1.0 AND esg_score <= 4.0));
  END IF;
END $$;

-- Add a `claim_vs_market` JSONB on thesis_validations so synthesis can store
-- the resolved benchmark + deviation flag rather than recomputing client-side.
ALTER TABLE public.thesis_validations
  ADD COLUMN IF NOT EXISTS benchmark_text text,
  ADD COLUMN IF NOT EXISTS deviation_flag text;

-- Add `takeaways` JSONB on module_scores so each dimension can carry its own
-- 3–5 institutional reads alongside summary_assessment.
ALTER TABLE public.module_scores
  ADD COLUMN IF NOT EXISTS takeaways jsonb;
