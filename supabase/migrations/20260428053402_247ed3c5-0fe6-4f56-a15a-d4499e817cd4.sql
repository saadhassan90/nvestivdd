-- Static benchmark database for market context grounding (PRD §7.2)
CREATE TABLE IF NOT EXISTS public.benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_class text NOT NULL,
  sub_asset_class text NOT NULL,
  market_segment text NOT NULL DEFAULT 'all',
  vintage_range text,
  sector_dynamics jsonb,
  vintage_performance jsonb,
  term_standards jsonb,
  sources jsonb DEFAULT '[]'::jsonb,
  version text NOT NULL DEFAULT 'v1.0',
  is_stale boolean NOT NULL DEFAULT false,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_class, sub_asset_class, market_segment, version)
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup
  ON public.benchmarks (asset_class, sub_asset_class, market_segment);

ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read benchmarks"
  ON public.benchmarks FOR SELECT
  TO public
  USING (true);

-- Seed v1.0 benchmarks (7 PE entries)
INSERT INTO public.benchmarks (asset_class, sub_asset_class, market_segment, vintage_range, sector_dynamics, vintage_performance, term_standards, sources)
VALUES
  ('private_equity','buyout','mid_market','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$1.1T","trend":"up","delta":"+8% YoY"},{"label":"Deal Volume","value":"3,420","trend":"down","delta":"-12% YoY"},{"label":"EV/EBITDA","value":"11.2x","trend":"flat","delta":"vs 11.4x peer median"},{"label":"Exit Multiple","value":"2.1x MOIC","trend":"down","delta":"-0.3x vs 5y avg"}],"notes":"Mid-market buyout deal flow normalizing post-2021 peak. Higher rates compressing entry multiples."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":21.5,"net_moic":2.3,"dpi":0.95},"median":{"net_irr_pct":15.2,"net_moic":1.8,"dpi":0.65},"bottom_quartile":{"net_irr_pct":8.4,"net_moic":1.3,"dpi":0.35}}'::jsonb,
    '{"mgmt_fee_pct":{"median":1.75,"range":"1.5–2.0% on committed during investment, 1.0–1.5% on invested thereafter"},"carry_pct":{"median":20,"range":"20% standard, 25% for top quartile"},"hurdle_pct":{"median":8,"range":"8% hard hurdle"},"gp_commit_pct":{"median":2,"range":"1–5% of fund size"},"waterfall":"European (whole-fund) preferred; American (deal-by-deal) requires LPAC consent"}'::jsonb,
    '["Preqin Q3 2024","Bain Global PE Report 2024","Cambridge Associates US PE 2Q24","PitchBook PE Breakdown 2024"]'::jsonb),
  ('private_equity','buyout','lower_mid_market','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$310B","trend":"up","delta":"+5% YoY"},{"label":"Deal Volume","value":"5,180","trend":"down","delta":"-8% YoY"},{"label":"EV/EBITDA","value":"8.5x","trend":"flat","delta":"vs 8.7x peer median"},{"label":"Exit Multiple","value":"2.3x MOIC","trend":"flat","delta":"≈ 5y avg"}],"notes":"Lower mid-market shows resilience with less multiple compression than upper segments."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":24.0,"net_moic":2.6,"dpi":0.85},"median":{"net_irr_pct":17.0,"net_moic":2.0,"dpi":0.55},"bottom_quartile":{"net_irr_pct":9.0,"net_moic":1.4,"dpi":0.30}}'::jsonb,
    '{"mgmt_fee_pct":{"median":2.0,"range":"1.75–2.0% on committed"},"carry_pct":{"median":20,"range":"20% standard"},"hurdle_pct":{"median":8,"range":"8% hard hurdle"},"gp_commit_pct":{"median":2.5,"range":"1–5%"},"waterfall":"European waterfall standard"}'::jsonb,
    '["Preqin Q3 2024","Cambridge Associates US PE 2Q24","PitchBook Lower MM 2024"]'::jsonb),
  ('private_equity','buyout','mega','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$680B","trend":"up","delta":"+15% YoY"},{"label":"Deal Volume","value":"540","trend":"down","delta":"-25% YoY"},{"label":"EV/EBITDA","value":"13.8x","trend":"down","delta":"vs 14.5x peer median"},{"label":"Exit Multiple","value":"1.9x MOIC","trend":"down","delta":"-0.4x vs 5y avg"}],"notes":"Mega-cap buyouts most affected by rate environment; sponsor-to-sponsor exits stalled."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":18.5,"net_moic":2.0,"dpi":1.05},"median":{"net_irr_pct":13.8,"net_moic":1.7,"dpi":0.75},"bottom_quartile":{"net_irr_pct":7.5,"net_moic":1.2,"dpi":0.40}}'::jsonb,
    '{"mgmt_fee_pct":{"median":1.5,"range":"1.25–1.75% on committed, fee step-down post investment period"},"carry_pct":{"median":20,"range":"20% standard"},"hurdle_pct":{"median":8,"range":"8% hard hurdle, occasionally soft"},"gp_commit_pct":{"median":2,"range":"1–3% (large absolute commit)"},"waterfall":"European whole-fund universal"}'::jsonb,
    '["Bain Global PE 2024","Preqin Q3 2024","McKinsey Global PE 2024"]'::jsonb),
  ('private_equity','growth','mid_market','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$420B","trend":"flat","delta":"≈ flat YoY"},{"label":"Deal Volume","value":"2,150","trend":"down","delta":"-18% YoY"},{"label":"Rev Multiple","value":"4.8x","trend":"down","delta":"vs 6.2x peak 2021"},{"label":"Exit Multiple","value":"2.4x MOIC","trend":"flat","delta":"≈ 5y avg"}],"notes":"Growth equity recalibrating after 2021 peak; revenue multiples contracted ~25% from peak."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":23.0,"net_moic":2.5,"dpi":0.65},"median":{"net_irr_pct":15.5,"net_moic":1.9,"dpi":0.40},"bottom_quartile":{"net_irr_pct":7.8,"net_moic":1.3,"dpi":0.20}}'::jsonb,
    '{"mgmt_fee_pct":{"median":2.0,"range":"1.75–2.0%"},"carry_pct":{"median":20,"range":"20% standard"},"hurdle_pct":{"median":8,"range":"8% hard hurdle"},"gp_commit_pct":{"median":2,"range":"1–3%"},"waterfall":"European whole-fund standard"}'::jsonb,
    '["Preqin Growth 2024","PitchBook Growth Equity 2024"]'::jsonb),
  ('private_equity','sector_focused','healthcare_mid','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$185B","trend":"up","delta":"+12% YoY"},{"label":"Deal Volume","value":"640","trend":"down","delta":"-15% YoY"},{"label":"EV/EBITDA","value":"12.5x","trend":"flat","delta":"premium to broader PE"},{"label":"Exit Multiple","value":"2.2x MOIC","trend":"flat","delta":"≈ 5y avg"}],"notes":"Healthcare commands persistent multiple premium; CMS reimbursement risk elevated."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":22.0,"net_moic":2.4,"dpi":0.85},"median":{"net_irr_pct":16.0,"net_moic":1.9,"dpi":0.60},"bottom_quartile":{"net_irr_pct":9.0,"net_moic":1.4,"dpi":0.30}}'::jsonb,
    '{"mgmt_fee_pct":{"median":2.0,"range":"1.75–2.0%"},"carry_pct":{"median":20,"range":"20% standard"},"hurdle_pct":{"median":8,"range":"8% hurdle"},"gp_commit_pct":{"median":2,"range":"1–3%"}}'::jsonb,
    '["Preqin Healthcare 2024","Bain Healthcare PE 2024"]'::jsonb),
  ('private_equity','sector_focused','industrial_mid','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$140B","trend":"flat","delta":"≈ flat YoY"},{"label":"Deal Volume","value":"820","trend":"down","delta":"-10% YoY"},{"label":"EV/EBITDA","value":"9.8x","trend":"flat","delta":"vs 10.1x peer median"},{"label":"Exit Multiple","value":"2.1x MOIC","trend":"flat","delta":"≈ 5y avg"}],"notes":"Industrial PE benefiting from reshoring tailwinds; cyclical exposure remains."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":20.5,"net_moic":2.2,"dpi":0.95},"median":{"net_irr_pct":14.5,"net_moic":1.7,"dpi":0.65},"bottom_quartile":{"net_irr_pct":8.0,"net_moic":1.3,"dpi":0.35}}'::jsonb,
    '{"mgmt_fee_pct":{"median":1.85,"range":"1.5–2.0%"},"carry_pct":{"median":20,"range":"20%"},"hurdle_pct":{"median":8,"range":"8%"},"gp_commit_pct":{"median":2,"range":"1–3%"}}'::jsonb,
    '["Preqin Industrials 2024"]'::jsonb),
  ('private_equity','growth','software_growth','2018-2024',
    '{"tiles":[{"label":"Dry Powder","value":"$240B","trend":"down","delta":"-5% YoY"},{"label":"Deal Volume","value":"1,180","trend":"down","delta":"-22% YoY"},{"label":"Rev Multiple","value":"5.2x","trend":"down","delta":"vs 11x peak 2021"},{"label":"Rule of 40","value":"42%","trend":"flat","delta":"median target threshold"}],"notes":"Software growth experienced largest multiple compression; Rule of 40 now table-stakes."}'::jsonb,
    '{"top_quartile":{"net_irr_pct":26.0,"net_moic":2.8,"dpi":0.45},"median":{"net_irr_pct":17.0,"net_moic":2.0,"dpi":0.30},"bottom_quartile":{"net_irr_pct":6.5,"net_moic":1.2,"dpi":0.10}}'::jsonb,
    '{"mgmt_fee_pct":{"median":2.0,"range":"2.0%"},"carry_pct":{"median":20,"range":"20% standard, occasionally 25%"},"hurdle_pct":{"median":8,"range":"8%, sometimes waived"},"gp_commit_pct":{"median":1.5,"range":"1–2%"}}'::jsonb,
    '["PitchBook Software 2024","Preqin Growth 2024"]'::jsonb)
ON CONFLICT (asset_class, sub_asset_class, market_segment, version) DO NOTHING;