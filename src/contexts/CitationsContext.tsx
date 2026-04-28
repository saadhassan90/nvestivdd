import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §6.4 — Interactive citations.
 *
 * Provides:
 *   - sourcesById   →  fast O(1) lookup by `citation_id` (e.g. "SRC_001") OR
 *                      raw row id (uuid). Components store `citation_ids: string[]`
 *                      on relational rows and we resolve here.
 *   - pin / unpin   →  add a source card to the bottom-right pinned stack.
 *   - pinned        →  ordered list (most-recent-first) of pinned sources.
 */

export type ResearchSource = Tables<"research_sources">;

interface CitationsCtx {
  sourcesById: Record<string, ResearchSource>;
  pinnedIds: string[];
  pinned: ResearchSource[];
  pin: (id: string) => void;
  unpin: (id: string) => void;
  toggle: (id: string) => void;
  isPinned: (id: string) => boolean;
  resolve: (id: string) => ResearchSource | null;
}

const Ctx = createContext<CitationsCtx | null>(null);

export function CitationsProvider({
  projectId,
  initialSources,
  children,
}: {
  projectId: string | null | undefined;
  initialSources?: ResearchSource[];
  children: React.ReactNode;
}) {
  const [sources, setSources] = useState<ResearchSource[]>(initialSources ?? []);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  // If parent didn't pass sources, fetch them ourselves (defensive default)
  useEffect(() => {
    if (initialSources && initialSources.length > 0) {
      setSources(initialSources);
      return;
    }
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("research_sources")
        .select("*")
        .eq("project_id", projectId);
      if (!cancelled && data) setSources(data);
    })();
    return () => { cancelled = true; };
  }, [projectId, initialSources]);

  const sourcesById = useMemo(() => {
    const map: Record<string, ResearchSource> = {};
    for (const s of sources) {
      if (s.citation_id) map[s.citation_id] = s;
      map[s.id] = s;
    }
    return map;
  }, [sources]);

  const resolve = useCallback(
    (id: string) => sourcesById[id] ?? null,
    [sourcesById],
  );

  const pin = useCallback((id: string) => {
    setPinnedIds((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 6)));
  }, []);
  const unpin = useCallback((id: string) => {
    setPinnedIds((prev) => prev.filter((p) => p !== id));
  }, []);
  const toggle = useCallback((id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [id, ...prev].slice(0, 6),
    );
  }, []);
  const isPinned = useCallback((id: string) => pinnedIds.includes(id), [pinnedIds]);

  const pinned = useMemo(
    () => pinnedIds.map((id) => sourcesById[id]).filter(Boolean) as ResearchSource[],
    [pinnedIds, sourcesById],
  );

  const value: CitationsCtx = {
    sourcesById,
    pinnedIds,
    pinned,
    pin,
    unpin,
    toggle,
    isPinned,
    resolve,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCitations(): CitationsCtx {
  const v = useContext(Ctx);
  if (!v) {
    // Safe fallback so components can render outside a provider
    return {
      sourcesById: {},
      pinnedIds: [],
      pinned: [],
      pin: () => {},
      unpin: () => {},
      toggle: () => {},
      isPinned: () => false,
      resolve: () => null,
    };
  }
  return v;
}