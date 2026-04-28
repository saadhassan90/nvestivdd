
-- =========================================================================
-- Phase 1 — L1 PRD v2.0 vocabulary, scoring, hard floor, completeness
-- =========================================================================

-- 1. Projects: new columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS recommendation_v2 text,
  ADD COLUMN IF NOT EXISTS score_tier_v2 text,
  ADD COLUMN IF NOT EXISTS completeness_pct integer,
  ADD COLUMN IF NOT EXISTS confidence_tier text,
  ADD COLUMN IF NOT EXISTS confidence_reason text;

-- 2. Module scores: tier label
ALTER TABLE public.module_scores
  ADD COLUMN IF NOT EXISTS tier_label text;

-- 3. Hard Floor catalogue
CREATE TABLE IF NOT EXISTS public.hard_floors (
  floor_id text PRIMARY KEY,
  title text NOT NULL,
  trigger_description text NOT NULL,
  asset_class text NOT NULL DEFAULT 'private_equity',
  display_order integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hard_floors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view hard floors" ON public.hard_floors;
CREATE POLICY "Anyone can view hard floors"
  ON public.hard_floors
  FOR SELECT
  USING (true);

-- 4. Hard Floor evaluations (per-project)
CREATE TABLE IF NOT EXISTS public.hard_floor_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  floor_id text NOT NULL REFERENCES public.hard_floors(floor_id),
  status text NOT NULL DEFAULT 'triggered',     -- triggered | not_triggered | not_assessed
  evidence_text text,
  source_refs jsonb DEFAULT '[]'::jsonb,
  triggered_at timestamptz,
  override_state text NOT NULL DEFAULT 'active', -- active | overridden
  override_reason text,
  override_author text,
  override_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, floor_id)
);

CREATE INDEX IF NOT EXISTS idx_hf_eval_project ON public.hard_floor_evaluations(project_id);

ALTER TABLE public.hard_floor_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access on hard_floor_evaluations" ON public.hard_floor_evaluations;
CREATE POLICY "Public access on hard_floor_evaluations"
  ON public.hard_floor_evaluations
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS update_hard_floor_evaluations_updated_at ON public.hard_floor_evaluations;
CREATE TRIGGER update_hard_floor_evaluations_updated_at
  BEFORE UPDATE ON public.hard_floor_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Seed Hard Floor catalogue (10 PE-specific floors)
INSERT INTO public.hard_floors (floor_id, title, trigger_description, display_order) VALUES
  ('HF-01', 'Active SEC enforcement', 'Open enforcement action against firm or named principal', 1),
  ('HF-02', 'Felony conviction', 'Principal with felony conviction within past 10 years', 2),
  ('HF-03', 'AUM contradiction', 'Stated AUM contradicted by Form ADV by >20%', 3),
  ('HF-04', 'Track record contradiction', 'Claimed deal attribution contradicted by independent evidence', 4),
  ('HF-05', 'Personal bankruptcy', 'Named principal bankruptcy within past 5 years', 5),
  ('HF-06', 'LP litigation', 'Pending material LP litigation against the GP', 6),
  ('HF-07', 'Partner litigation', 'Active partner litigation affecting key persons', 7),
  ('HF-08', 'Marketing fraud', 'Documented fraud or material misrepresentation', 8),
  ('HF-09', 'Missing SEC registration', 'RAUM thresholds met, registration absent', 9),
  ('HF-10', 'Sanctioned service provider', 'Auditor or fund administrator with sanctioned history', 10)
ON CONFLICT (floor_id) DO UPDATE
  SET title = EXCLUDED.title,
      trigger_description = EXCLUDED.trigger_description,
      display_order = EXCLUDED.display_order;

-- 6. Backfill recommendation_v2 from existing free-text recommendation + score
UPDATE public.projects
SET recommendation_v2 = CASE
  WHEN recommendation ILIKE '%decline%' THEN 'Decline'
  WHEN recommendation ILIKE '%strong advance%' OR recommendation ILIKE '%pursue%' THEN 'Advance'
  WHEN recommendation ILIKE '%conditional%' OR recommendation ILIKE '%conditional meet%' THEN 'Conditional Advance'
  WHEN recommendation ILIKE '%review%' OR recommendation ILIKE '%pass%' THEN 'Defer'
  WHEN recommendation ILIKE '%advance%' THEN 'Advance'
  WHEN recommendation IS NULL AND composite_score IS NULL THEN NULL
  WHEN composite_score >= 75 THEN 'Advance'
  WHEN composite_score >= 60 THEN 'Conditional Advance'
  WHEN composite_score >= 40 THEN 'Defer'
  ELSE 'Decline'
END
WHERE recommendation_v2 IS NULL;

-- 7. Backfill score_tier_v2 from composite_score (6-tier scheme)
UPDATE public.projects
SET score_tier_v2 = CASE
  WHEN composite_score IS NULL THEN 'Insufficient Data'
  WHEN composite_score >= 90 THEN 'Exceptional'
  WHEN composite_score >= 75 THEN 'Strong'
  WHEN composite_score >= 60 THEN 'Adequate'
  WHEN composite_score >= 40 THEN 'Below Average'
  WHEN composite_score >= 1  THEN 'Concerning'
  ELSE 'Insufficient Data'
END
WHERE score_tier_v2 IS NULL;

-- 8. Backfill module_scores.tier_label from numeric score (section scores are 1–10)
UPDATE public.module_scores
SET tier_label = CASE
  WHEN score IS NULL OR score = 0 THEN 'Insufficient Data'
  WHEN score >= 9    THEN 'Exceptional'
  WHEN score >= 7.5  THEN 'Strong'
  WHEN score >= 6    THEN 'Adequate'
  WHEN score >= 4    THEN 'Below Average'
  WHEN score >= 1    THEN 'Concerning'
  ELSE 'Insufficient Data'
END
WHERE tier_label IS NULL;
