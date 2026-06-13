import { NvestivLoader, useNvestivLoaderGate } from "@/components/ui/NvestivLoader";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useChatContext } from "@/contexts/ChatContext";
import { ProjectTopBar } from "@/components/project/ProjectTopBar";
import { ProjectStageRail } from "@/components/project/ProjectStageRail";
import { IcMemoCanvas } from "@/components/memo/IcMemoCanvas";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ShareModal } from "@/components/project/ShareModal";
import { useReportZoom } from "@/hooks/use-report-zoom";
import { useIcMemo } from "@/hooks/use-ic-memo";
import { buildIcMemoSkeletonMarkdown } from "@/lib/ic-memo-template";
import type { Tables } from "@/integrations/supabase/types";

export default function IcMemoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setProjectScope, setIsOpen: setChatOpen } = useChatContext();
  const [shareOpen, setShareOpen] = useState(false);

  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [redFlags, setRedFlags] = useState<Tables<"red_flags">[]>([]);
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const zoomCtl = useReportZoom();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function fetchAll() {
      const [p, f, fees, team] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("red_flags").select("*").eq("project_id", id).order("order_index"),
        supabase.from("fee_structure").select("*").eq("project_id", id).order("order_index"),
        supabase.from("team_members").select("*").eq("project_id", id).order("order_index"),
      ]);
      if (cancelled) return;
      if (p.data) setProject(p.data);
      if (f.data) setRedFlags(f.data);
      if (fees.data) setFeeStructure(fees.data);
      if (team.data) setTeamMembers(team.data);
      setLoading(false);
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Scope chat to this project so Iris is always co-authoring
  useEffect(() => {
    if (project) setProjectScope({ id: project.id, name: project.fund_name });
    return () => setProjectScope(null);
  }, [project?.id, project?.fund_name, setProjectScope]);

  const { memo, loading: memoLoading, scheduleSave, resetToTemplate } =
    useIcMemo({ project, redFlags, feeStructure, teamMembers });

  const seedMarkdown = project
    ? buildIcMemoSkeletonMarkdown({ project, redFlags, feeStructure, teamMembers })
    : "";

  const handleCanvasChange = useCallback(
    (json: any, markdown: string) => {
      scheduleSave(json, markdown);
    },
    [scheduleSave],
  );

  // Stable resetKey: only changes on memo identity (initial load / reset to template
 // / remote realtime updates), NOT on every local save. Otherwise the editor would
 // remount on each save and wipe the undo (Cmd/Ctrl-Z) history.
  const lastSeenMemoIdRef = useRef<string | null>(null);
  const resetCounterRef = useRef(0);
  const resetKey = useMemo(() => {
    if (!memo) return "init";
    if (lastSeenMemoIdRef.current !== memo.id) {
      lastSeenMemoIdRef.current = memo.id;
      resetCounterRef.current += 1;
    }
    return `${memo.id}-${resetCounterRef.current}`;
    // Intentionally exclude memo.version — local saves bump version and would remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memo?.id]);

  const showInitialLoader = useNvestivLoaderGate(loading || !project);
  const showMemoLoader = useNvestivLoaderGate(memoLoading || !memo);
  if (showInitialLoader) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NvestivLoader size={140} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <ProjectTopBar
        project={project}
        isProcessing={false}
        mode="memo"
        reportLevel="L3"
        onReportLevelChange={(lvl) => {
          if (lvl === "L1") navigate(`/project/${project.id}?tab=summary`);
          else if (lvl === "ODD") navigate(`/project/${project.id}?stage=odd`);
          else if (lvl === "L3") navigate(`/project/${project.id}/memo`);
        }}
        onReset={resetToTemplate}
        getExportMarkdown={() => memo?.content_markdown || seedMarkdown}
        exportFilename={`${project.fund_name.replace(/\s+/g, "_")}_IC_Memo`}
        exportCurrentScope="memo"
        zoom={{
          value: zoomCtl.zoom,
          onIn: zoomCtl.zoomIn,
          onOut: zoomCtl.zoomOut,
          onReset: zoomCtl.reset,
          canIn: zoomCtl.canIn,
          canOut: zoomCtl.canOut,
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ProjectStageRail
          reportLevel="L3"
          onReportLevelChange={(lvl) => {
            if (lvl === "L1") navigate(`/project/${project.id}?tab=summary`);
            else if (lvl === "ODD") navigate(`/project/${project.id}?stage=odd`);
            else if (lvl === "L3") navigate(`/project/${project.id}/memo`);
          }}
        />
        {/* Canvas column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-8 bg-background">
            {showMemoLoader ? (
              <NvestivLoader fullscreen size={96} />
            ) : (
              <div style={{ zoom: zoomCtl.zoom } as React.CSSProperties}>
                <IcMemoCanvas
                  contentJson={memo.content_json}
                  seedMarkdown={memo.content_markdown || seedMarkdown}
                  onChange={handleCanvasChange}
                  resetKey={resetKey}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      <MobileBottomNav
        onOpenShare={() => setShareOpen(true)}
        onOpenAskIris={() => setChatOpen(true)}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fundName={project.fund_name}
        projectId={project.id}
        getExportMarkdown={() => memo?.content_markdown || seedMarkdown}
        exportFilename={`${project.fund_name.replace(/\s+/g, "_")}_IC_Memo`}
        currentScope="memo"
      />
    </div>
  );
}