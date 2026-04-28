-- Phase 4.2 — Normalize module_scores keys, labels, and weights to PRD v2.0
-- Mapping logic: match on module_key OR module_label substrings, in order of specificity.

UPDATE public.module_scores
SET
  module_key = CASE
    -- Track Record / Performance (check first; "performance" beats generic "financial")
    WHEN module_key ILIKE '%performance%' OR module_label ILIKE '%performance%'
      OR module_key ILIKE '%track%' OR module_label ILIKE '%track%'
      OR module_key = 'D_performance' OR module_key = 'module_a_financial'
      OR module_label ILIKE '%historical%'
      THEN 'track_record'

    -- Team & Manager
    WHEN module_key ILIKE '%team%' OR module_label ILIKE '%team%'
      OR module_key ILIKE '%manager%' OR module_label ILIKE '%manager%'
      OR module_key = 'module_b_team' OR module_key = 'module_a' OR module_key = 'C_team_management'
      THEN 'team'

    -- Investment Thesis (strategy / thesis)
    WHEN module_key ILIKE '%thesis%' OR module_label ILIKE '%thesis%'
      OR module_key ILIKE '%strategy%' OR module_label ILIKE '%strategy%'
      OR module_key = 'module_c' OR module_key = 'module_c_strategy' OR module_key = 'B_strategy_market'
      THEN 'investment_thesis'

    -- Market Reality
    WHEN module_key ILIKE '%market%' OR module_label ILIKE '%market%'
      OR module_key ILIKE '%domain%' OR module_label ILIKE '%domain%'
      OR module_key = 'module_d'
      THEN 'market_reality'

    -- Economics (terms / fees / structure)
    WHEN module_key ILIKE '%terms%' OR module_label ILIKE '%terms%'
      OR module_key ILIKE '%fee%' OR module_label ILIKE '%fee%'
      OR module_key ILIKE '%econom%' OR module_label ILIKE '%econom%'
      OR module_key = 'module_d_terms'
      OR module_label ILIKE '%fund structure%'
      THEN 'economics'

    -- Operations / red-flag rows → regulatory_ops (excluded from composite)
    WHEN module_key ILIKE '%operation%' OR module_label ILIKE '%operation%'
      OR module_key ILIKE '%red%' OR module_label ILIKE '%red%'
      OR module_key ILIKE '%structural%' OR module_label ILIKE '%structural%'
      OR module_key = 'module_e' OR module_key = 'module_e_operations' OR module_key = 'E_operational'
      THEN 'regulatory_ops'

    ELSE module_key
  END,

  module_label = CASE
    WHEN module_key ILIKE '%performance%' OR module_label ILIKE '%performance%'
      OR module_key ILIKE '%track%' OR module_label ILIKE '%track%'
      OR module_key = 'D_performance' OR module_key = 'module_a_financial'
      OR module_label ILIKE '%historical%'
      THEN 'Track Record'

    WHEN module_key ILIKE '%team%' OR module_label ILIKE '%team%'
      OR module_key ILIKE '%manager%' OR module_label ILIKE '%manager%'
      OR module_key = 'module_b_team' OR module_key = 'module_a' OR module_key = 'C_team_management'
      THEN 'Team & Manager'

    WHEN module_key ILIKE '%thesis%' OR module_label ILIKE '%thesis%'
      OR module_key ILIKE '%strategy%' OR module_label ILIKE '%strategy%'
      OR module_key = 'module_c' OR module_key = 'module_c_strategy' OR module_key = 'B_strategy_market'
      THEN 'Investment Thesis'

    WHEN module_key ILIKE '%market%' OR module_label ILIKE '%market%'
      OR module_key ILIKE '%domain%' OR module_label ILIKE '%domain%'
      OR module_key = 'module_d'
      THEN 'Market Reality'

    WHEN module_key ILIKE '%terms%' OR module_label ILIKE '%terms%'
      OR module_key ILIKE '%fee%' OR module_label ILIKE '%fee%'
      OR module_key ILIKE '%econom%' OR module_label ILIKE '%econom%'
      OR module_key = 'module_d_terms'
      OR module_label ILIKE '%fund structure%'
      THEN 'Economics'

    WHEN module_key ILIKE '%operation%' OR module_label ILIKE '%operation%'
      OR module_key ILIKE '%red%' OR module_label ILIKE '%red%'
      OR module_key ILIKE '%structural%' OR module_label ILIKE '%structural%'
      OR module_key = 'module_e' OR module_key = 'module_e_operations' OR module_key = 'E_operational'
      THEN 'Regulatory & Operational Hygiene'

    ELSE module_label
  END;

-- Now apply canonical weights based on the normalized module_key
UPDATE public.module_scores
SET weight = CASE module_key
  WHEN 'investment_thesis' THEN 15
  WHEN 'market_reality'    THEN 20
  WHEN 'team'              THEN 25
  WHEN 'track_record'      THEN 20
  WHEN 'economics'         THEN 20
  WHEN 'regulatory_ops'    THEN 0
  ELSE weight
END
WHERE module_key IN ('investment_thesis','market_reality','team','track_record','economics','regulatory_ops');