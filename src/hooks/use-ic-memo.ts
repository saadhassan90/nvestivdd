import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { buildIcMemoSkeletonMarkdown } from "@/lib/ic-memo-template";

export type IcMemoRow = {
  id: string;
  project_id: string;
  content_json: any;
  content_markdown: string;
  version: number;
  updated_at: string;
};

/**
 * Loads (or seeds) the IC memo for a project, persists debounced updates,
 * and exposes a realtime channel so chat-driven edits appear live.
 */
export function useIcMemo(opts: {
  project: Tables<"projects"> | null;
  redFlags?: Tables<"red_flags">[];
  feeStructure?: any[];
  teamMembers?: any[];
}) {
  const { project, redFlags, feeStructure, teamMembers } = opts;
  const [memo, setMemo] = useState<IcMemoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRemoteVersion = useRef<number>(0);

  // Initial load / seed
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!project) return;
      setLoading(true);
      const { data } = await supabase
        .from("ic_memos")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setMemo(data as IcMemoRow);
        lastRemoteVersion.current = data.version;
      } else {
        const seedMd = buildIcMemoSkeletonMarkdown({
          project,
          redFlags,
          feeStructure,
          teamMembers,
        });
        const { data: inserted } = await supabase
          .from("ic_memos")
          .insert({
            project_id: project.id,
            content_json: [],
            content_markdown: seedMd,
            version: 1,
          })
          .select()
          .single();
        if (inserted && !cancelled) {
          setMemo(inserted as IcMemoRow);
          lastRemoteVersion.current = inserted.version;
        }
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // Realtime subscription (chat-driven edits)
  useEffect(() => {
    if (!project) return;
    const ch = supabase
      .channel(`ic_memo-${project.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ic_memos",
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const next = payload.new as IcMemoRow;
          // Ignore self-originated saves (we already have the latest content)
          if (next.version > lastRemoteVersion.current) {
            lastRemoteVersion.current = next.version;
            setMemo(next);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [project?.id]);

  const persist = useCallback(
    async (contentJson: any, contentMarkdown: string) => {
      if (!memo) return;
      setSavingState("saving");
      const nextVersion = memo.version + 1;
      const { data } = await supabase
        .from("ic_memos")
        .update({
          content_json: contentJson,
          content_markdown: contentMarkdown,
          version: nextVersion,
        })
        .eq("id", memo.id)
        .select()
        .single();
      if (data) {
        setMemo(data as IcMemoRow);
        lastRemoteVersion.current = (data as IcMemoRow).version;
      }
      setSavingState("saved");
      setLastSavedAt(new Date());
      setTimeout(() => setSavingState("idle"), 1500);
    },
    [memo],
  );

  const scheduleSave = useCallback(
    (contentJson: any, contentMarkdown: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        persist(contentJson, contentMarkdown);
      }, 1500);
    },
    [persist],
  );

  const resetToTemplate = useCallback(async () => {
    if (!project) return;
    const seedMd = buildIcMemoSkeletonMarkdown({
      project,
      redFlags,
      feeStructure,
      teamMembers,
    });
    if (!memo) return;
    const nextVersion = memo.version + 1;
    const { data } = await supabase
      .from("ic_memos")
      .update({
        content_markdown: seedMd,
        content_json: [],
        version: nextVersion,
      })
      .eq("id", memo.id)
      .select()
      .single();
    if (data) {
      setMemo(data as IcMemoRow);
      lastRemoteVersion.current = (data as IcMemoRow).version;
    }
  }, [memo, project, redFlags, feeStructure, teamMembers]);

  return {
    memo,
    loading,
    savingState,
    lastSavedAt,
    scheduleSave,
    resetToTemplate,
  };
}