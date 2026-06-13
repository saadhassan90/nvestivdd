import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ODD_SECTIONS, type OddSectionKey } from "@/lib/odd-template";
import { useOddReport } from "@/hooks/use-odd-report";
import { type OddSectionStatusUi } from "./OddLeftRail";
import { OddCanvas } from "./OddCanvas";
import { OddEmptyState } from "./OddEmptyState";
import { OddImportModal } from "./OddImportModal";
import { generateMockOddReport } from "@/lib/odd-mock-generator";

interface OddWorkspaceProps {
  project: Tables<"projects">;
}

function StatusIcon({ status }: { status: OddSectionStatusUi }) {
  switch (status) {
    case "generating":
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    case "verified":
      return <CheckCircle2 className="h-3 w-3 text-score-strong" />;
    case "flagged":
    case "error":
      return <AlertTriangle className="h-3 w-3 text-severity-critical" />;
    case "unverified":
    default:
      return <Circle className="h-3 w-3 text-muted-foreground/60" />;
  }
}

function RiskBadge({ rating }: { rating: "low" | "medium" | "high" }) {
  const color =
    rating === "low"
      ? "text-score-strong"
      : rating === "medium"
        ? "text-score-review"
        : "text-severity-critical";
  const dot =
    rating === "low"
      ? "bg-score-strong"
      : rating === "medium"
        ? "bg-score-review"
        : "bg-severity-critical";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
        color,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      Risk: {rating}
    </span>
  );
}

export function OddWorkspace({ project }: OddWorkspaceProps) {
  const { toast } = useToast();
  const {
    sections,
    hasImport,
    allComplete,
    riskRating,
    startAnalysis,
    retrySection,
  } = useOddReport(project.id, project.fund_name);

  const [importOpen, setImportOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<OddSectionKey | null>(null);
  const scrollFnRef = useRef<((key: OddSectionKey) => void) | null>(null);

  // Derive left-rail status from runtime state
  const sectionStatuses = useMemo(() => {
    const map: Record<OddSectionKey, OddSectionStatusUi> = {} as any;
    for (const s of ODD_SECTIONS) {
      const st = sections[s.key];
      if (!st || (!hasImport && st.status === "pending")) {
        map[s.key] = "unverified";
      } else if (st.status === "pending" || st.status === "running") {
        map[s.key] = "generating";
      } else if (st.status === "error") {
        map[s.key] = "error";
      } else if (st.status === "complete") {
        // We don't have per-row verification yet — treat as verified by default
        map[s.key] = "verified";
      } else {
        map[s.key] = "unverified";
      }
    }
    return map;
  }, [sections, hasImport]);

  const handleImportSubmit = useCallback(
    async ({ daseti, supporting }: { daseti: File; supporting: File[] }) => {
      // Upload Daseti export
      const dasetiPath = `${project.id}/odd/${Date.now()}-${daseti.name}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(dasetiPath, daseti, { upsert: false });
      if (upErr) throw upErr;

      // Upload supporting docs
      const supportingPaths: string[] = [];
      for (const f of supporting) {
        const p = `${project.id}/odd/${Date.now()}-${f.name}`;
        const { error } = await supabase.storage.from("documents").upload(p, f, { upsert: false });
        if (!error) supportingPaths.push(p);
      }

      // Record documents
      await supabase.from("documents").insert([
        {
          project_id: project.id,
          file_name: daseti.name,
          file_path: dasetiPath,
          file_type: daseti.type || daseti.name.split(".").pop() || null,
          file_size: daseti.size,
          document_type_classified: "daseti_export",
        },
        ...supporting.map((f, i) => ({
          project_id: project.id,
          file_name: f.name,
          file_path: supportingPaths[i],
          file_type: f.type || f.name.split(".").pop() || null,
          file_size: f.size,
          document_type_classified: "odd_supporting",
        })),
      ]);

      await startAnalysis({ dasetiPath, supportingPaths });
      toast({ title: "ODD analysis started", description: "Sections will unlock as they complete." });
    },
    [project.id, startAnalysis, toast],
  );

  const handleSectionClick = useCallback((key: OddSectionKey) => {
    setActiveKey(key);
    scrollFnRef.current?.(key);
  }, []);

  // Debounced per-section persistence of inline edits
  const saveTimers = useRef<Partial<Record<OddSectionKey, ReturnType<typeof setTimeout>>>>({});
  const handleSectionEdit = useCallback(
    (key: OddSectionKey, markdown: string) => {
      const existing = saveTimers.current[key];
      if (existing) clearTimeout(existing);
      saveTimers.current[key] = setTimeout(async () => {
        await supabase
          .from("odd_section_results")
          .update({ content_markdown: markdown })
          .eq("project_id", project.id)
          .eq("section_key", key);
      }, 800);
    },
    [project.id],
  );

  const handleTestRun = useCallback(async () => {
    await generateMockOddReport(project.id, project.fund_name);
    toast({
      title: "Mock ODD report generated",
      description: "Populated from existing fund data — for demo purposes only.",
    });
  }, [project.id, project.fund_name, toast]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-border bg-card/40 px-5 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            ODD
          </span>
          {hasImport && (
            <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
              {ODD_SECTIONS.map((s) => {
                const status = sectionStatuses[s.key] ?? "unverified";
                const isActive = activeKey === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleSectionClick(s.key)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors border",
                      isActive
                        ? "bg-muted text-foreground border-border"
                        : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <StatusIcon status={status} />
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {hasImport && allComplete && riskRating && (
              <RiskBadge rating={riskRating} />
            )}
            {hasImport && (
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Upload className="h-3 w-3" />
                Re-import
              </button>
            )}
          </div>
        </div>

        {hasImport ? (
          <OddCanvas
            fundName={project.fund_name}
            sections={sections}
            onRetrySection={retrySection}
            onSectionEdit={handleSectionEdit}
            onRegisterScroll={(fn) => {
              scrollFnRef.current = fn;
            }}
            onActiveSectionChange={setActiveKey}
          />
        ) : (
          <OddEmptyState onImportClick={() => setImportOpen(true)} />
        )}
      </div>

      <OddImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSubmit={handleImportSubmit}
        onTestRun={handleTestRun}
        hasExistingReport={hasImport}
      />
    </div>
  );
}