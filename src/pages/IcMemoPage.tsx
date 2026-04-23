import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useChatContext } from "@/contexts/ChatContext";
import { ProjectTopBar } from "@/components/project/ProjectTopBar";
import { IcMemoCanvas } from "@/components/memo/IcMemoCanvas";
import { MemoToolbar } from "@/components/memo/MemoToolbar";
import { EmbeddedIrisChat } from "@/components/memo/EmbeddedIrisChat";
import { useIcMemo } from "@/hooks/use-ic-memo";
import { buildIcMemoSkeletonMarkdown } from "@/lib/ic-memo-template";
import type { Tables } from "@/integrations/supabase/types";

export default function IcMemoPage() {
  const { id } = useParams<{ id: string }>();
  const { setProjectScope } = useChatContext();

  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [redFlags, setRedFlags] = useState<Tables<"red_flags">[]>([]);
  const [feeStructure, setFeeStructure] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const { memo, loading: memoLoading, savingState, lastSavedAt, scheduleSave, resetToTemplate } =
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

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <ProjectTopBar project={project} isProcessing={false} mode="memo" />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Canvas column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <MemoToolbar
            fundName={project.fund_name}
            savingState={savingState}
            lastSavedAt={lastSavedAt}
            contentMarkdown={memo?.content_markdown || seedMarkdown}
            onResetToTemplate={resetToTemplate}
          />
          <main className="flex-1 overflow-y-auto py-8 px-4 sm:px-8 bg-background">
            {memoLoading || !memo ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-foreground" />
              </div>
            ) : (
              <IcMemoCanvas
                contentJson={memo.content_json}
                seedMarkdown={memo.content_markdown || seedMarkdown}
                onChange={handleCanvasChange}
                resetKey={`${memo.id}-${memo.version}`}
              />
            )}
          </main>
        </div>

        {/* Chat column — desktop only */}
        <div className="hidden lg:block w-[420px] shrink-0 border-l border-border">
          <EmbeddedIrisChat fundName={project.fund_name} memoId={memo?.id ?? null} />
        </div>
      </div>
    </div>
  );
}