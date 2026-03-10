import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseReportSections, type ReportSection } from "@/lib/markdown-sections";

/**
 * Hook to fetch and parse the L1 report markdown for a project.
 * Tries the `report_markdown` column first, then falls back to storage bucket.
 */
export function useReportMarkdown(projectId: string | undefined) {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchMarkdown() {
      setLoading(true);

      // 1. Try from project column
      const { data: project } = await supabase
        .from('projects')
        .select('report_markdown')
        .eq('id', projectId)
        .single();

      if (project?.report_markdown) {
        const md = project.report_markdown as string;
        setRawMarkdown(md);
        setSections(parseReportSections(md));
        setLoading(false);
        return;
      }

      // 2. Fallback: try from storage bucket
      const { data: storageData } = await supabase.storage
        .from('reports')
        .download(`${projectId}/l1_report.md`);

      if (storageData) {
        const md = await storageData.text();
        setRawMarkdown(md);
        setSections(parseReportSections(md));
        setLoading(false);
        return;
      }

      setLoading(false);
    }

    fetchMarkdown();
  }, [projectId]);

  return { sections, rawMarkdown, loading };
}
