
-- Public demo: no auth. Enable RLS on remaining tables and grant public ALL access
-- to preserve current behavior while clearing "RLS disabled" scanner errors.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'competitive_landscape',
    'critical_info_gaps',
    'data_room_items',
    'document_quality_flags',
    'documents',
    'engagement_case_studies',
    'fee_structure',
    'interrogatory_items',
    'market_factors',
    'module_scores',
    'performance_metrics',
    'projects',
    'red_flags',
    'report_sections',
    'service_providers',
    'submission_quality',
    'task_queue',
    'team_members',
    'thesis_validations'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public demo access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Public demo access" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
