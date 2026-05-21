import { useCallback, useMemo, useRef, useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { EmbeddedIrisChat } from "@/components/memo/EmbeddedIrisChat";
import { ODD_SECTIONS, type OddSectionKey } from "@/lib/odd-template";
import { useOddReport } from "@/hooks/use-odd-report";
import { OddLeftRail, type OddSectionStatusUi } from "./OddLeftRail";
import { OddCanvas } from "./OddCanvas";
import { OddEmptyState } from "./OddEmptyState";
import { OddImportModal } from "./OddImportModal";
import { generateMockOddReport } from "@/lib/odd-mock-generator";

interface OddWorkspaceProps {
  project: Tables<"projects">;
}

export function OddWorkspace({ project }: OddWorkspaceProps) {
  const { toast } = useToast();
  const { setIsOpen: setChatOpen } = useChatContext();
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
      <OddLeftRail
        sectionStatuses={sectionStatuses}
        activeKey={activeKey}
        onSectionClick={handleSectionClick}
        riskRating={allComplete ? riskRating : null}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-border bg-card/40 px-5 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              ODD Workspace
            </span>
            {hasImport && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                ADIA
              </span>
            )}
          </div>
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

        {/* Mobile Ask Iris floating button */}
        <button
          onClick={() => setChatOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background shadow-lg"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask Iris
        </button>
      </div>

      {/* Right rail — desktop only */}
      <div className="hidden lg:block w-[380px] shrink-0 border-l border-border">
        <EmbeddedIrisChat fundName={project.fund_name} memoId={null} oddProjectId={project.id} />
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