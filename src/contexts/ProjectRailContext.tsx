import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ReportZoomControls } from "@/hooks/use-report-zoom";

type Level = "L1" | "L2" | "L3" | "ODD";

export interface ProjectRailState {
  reportLevel: Level;
  onReportLevelChange: (lvl: Level) => void;
  bookmarks?: ReactNode;
  sectionBookmarks?: ReactNode;
  zoom?: ReportZoomControls;
}

interface Ctx {
  state: ProjectRailState | null;
  setState: (s: ProjectRailState | null) => void;
}

const ProjectRailCtx = createContext<Ctx | null>(null);

export function ProjectRailProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectRailState | null>(null);
  const value = useMemo<Ctx>(() => ({ state, setState }), [state]);
  return <ProjectRailCtx.Provider value={value}>{children}</ProjectRailCtx.Provider>;
}

export function useProjectRailState(): ProjectRailState | null {
  const ctx = useContext(ProjectRailCtx);
  return ctx?.state ?? null;
}

/**
 * Pages call this to register their rail config with the persistent shell.
 * The rail itself lives in `ProjectChrome` and never unmounts as the user
 * navigates between Triage / ODD / IC Memo.
 */
export function useSetProjectRail(state: ProjectRailState | null, deps: ReadonlyArray<unknown>) {
  const ctx = useContext(ProjectRailCtx);
  const set = ctx?.setState;
  // We intentionally key the effect on `deps` provided by the caller so the
  // rail only updates when something meaningful changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoState = useMemo(() => state, deps);
  useEffect(() => {
    if (!set) return;
    set(memoState);
    return () => set(null);
  }, [set, memoState]);
}

export function useClearProjectRail() {
  const ctx = useContext(ProjectRailCtx);
  const set = ctx?.setState;
  return useCallback(() => set?.(null), [set]);
}