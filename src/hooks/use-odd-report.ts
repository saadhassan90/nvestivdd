import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ODD_SECTIONS, type OddSectionKey, assembleOddMarkdown } from "@/lib/odd-template";
import type { OddSectionState } from "@/components/odd/OddCanvas";

export type RiskRating = "low" | "medium" | "high" | null;

export interface OddReportRow {
  id: string;
  project_id: string;
  content_json: any;
  content_markdown: string;
  risk_rating: RiskRating;
  version: number;
  updated_at: string;
}

export interface OddSectionResultRow {
  id: string;
  project_id: string;
  section_key: OddSectionKey;
  status: "pending" | "running" | "complete" | "error";
  content_markdown: string | null;
  verification_status: "verified" | "flagged" | null;
  flag_count: number;
  error_message: string | null;
}

const EMPTY_SECTIONS: Record<OddSectionKey, OddSectionState> = ODD_SECTIONS.reduce(
  (acc, s) => {
    acc[s.key] = { status: "pending", content: null };
    return acc;
  },
  {} as Record<OddSectionKey, OddSectionState>,
);

/**
 * Load + subscribe to the ODD report for a project. Returns the report row,
 * per-section state (status / content / error), and a flag indicating whether
 * any import has been kicked off yet.
 */
export function useOddReport(projectId: string | null, fundName: string) {
  const [report, setReport] = useState<OddReportRow | null>(null);
  const [sectionRows, setSectionRows] = useState<OddSectionResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  // initial fetch
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [r, sr] = await Promise.all([
        supabase.from("odd_reports").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("odd_section_results").select("*").eq("project_id", projectId),
      ]);
      if (cancelled) return;
      if (r.data) setReport(r.data as OddReportRow);
      if (sr.data) setSectionRows(sr.data as OddSectionResultRow[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // realtime subscription on both tables
  useEffect(() => {
    if (!projectId) return;
    const ch = supabase
      .channel(`odd-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "odd_section_results", filter: `project_id=eq.${projectId}` },
        (payload) => {
          setSectionRows((prev) => {
            const next = [...prev];
            const row = (payload.new ?? payload.old) as OddSectionResultRow;
            const idx = next.findIndex((r) => r.section_key === row.section_key);
            if (payload.eventType === "DELETE") {
              return next.filter((r) => r.section_key !== row.section_key);
            }
            if (idx === -1) next.push(payload.new as OddSectionResultRow);
            else next[idx] = payload.new as OddSectionResultRow;
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "odd_reports", filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === "DELETE") setReport(null);
          else setReport(payload.new as OddReportRow);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [projectId]);

  const sections = useMemo<Record<OddSectionKey, OddSectionState>>(() => {
    const map: Record<OddSectionKey, OddSectionState> = { ...EMPTY_SECTIONS };
    for (const row of sectionRows) {
      map[row.section_key] = {
        status: row.status,
        content: row.content_markdown,
        errorMessage: row.error_message,
      };
    }
    return map;
  }, [sectionRows]);

  const hasImport = sectionRows.length > 0 || !!report;

  const allComplete = useMemo(
    () =>
      ODD_SECTIONS.every((s) => {
        const st = sections[s.key]?.status;
        return st === "complete";
      }),
    [sections],
  );

  /** Kick off the ODD pipeline. Creates report row, six pending section rows, and a task_queue entry. */
  const startAnalysis = useCallback(
    async (opts: { dasetiPath: string; supportingPaths: string[] }) => {
      if (!projectId) return;

      // 1. Upsert report row (reset content)
      const seedMd = assembleOddMarkdown({ fundName, sectionContent: {} });
      await supabase
        .from("odd_reports")
        .upsert(
          {
            project_id: projectId,
            content_json: [],
            content_markdown: seedMd,
            risk_rating: null,
            version: (report?.version ?? 0) + 1,
          },
          { onConflict: "project_id" },
        );

      // 2. Reset all six section rows to pending
      const sectionUpserts = ODD_SECTIONS.map((s) => ({
        project_id: projectId,
        section_key: s.key,
        status: "pending",
        content_markdown: null,
        verification_status: null,
        flag_count: 0,
        error_message: null,
      }));
      await supabase
        .from("odd_section_results")
        .upsert(sectionUpserts, { onConflict: "project_id,section_key" });

      // 3. Enqueue task
      await supabase.from("task_queue").insert({
        project_id: projectId,
        task_type: "odd_analysis",
        status: "pending",
        input_payload: {
          daseti_path: opts.dasetiPath,
          supporting_paths: opts.supportingPaths,
          fund_name: fundName,
        } as any,
      });
    },
    [projectId, fundName, report?.version],
  );

  const retrySection = useCallback(
    async (key: OddSectionKey) => {
      if (!projectId) return;
      await supabase
        .from("odd_section_results")
        .update({ status: "pending", error_message: null })
        .eq("project_id", projectId)
        .eq("section_key", key);

      await supabase.from("task_queue").insert({
        project_id: projectId,
        task_type: "odd_analysis",
        status: "pending",
        input_payload: { retry_section: key } as any,
      });
    },
    [projectId],
  );

  return {
    report,
    sections,
    loading,
    hasImport,
    allComplete,
    riskRating: (report?.risk_rating ?? null) as RiskRating,
    startAnalysis,
    retrySection,
  };
}