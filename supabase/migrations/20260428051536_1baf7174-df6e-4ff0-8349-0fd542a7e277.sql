ALTER TABLE public.module_scores
  ADD COLUMN IF NOT EXISTS sub_scores jsonb;

COMMENT ON COLUMN public.module_scores.sub_scores IS
  'PRD §4.3 sub-score drill-down. Array of {key,label,weight,score,rationale,source_refs[]}.';