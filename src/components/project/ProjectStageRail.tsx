import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Lock, ZoomIn, ZoomOut, ChevronRight, ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ReportZoomControls } from "@/hooks/use-report-zoom";

type Level = "L1" | "L2" | "L3" | "ODD";

interface ProjectStageRailProps {
  reportLevel: Level;
  onReportLevelChange: (level: Level) => void;
  bookmarks?: ReactNode;
  /** A separate "Bookmarks" group rendered below the stage tabs.
   *  Used by BlockNote-backed stages (ODD, IC Memo) for heading anchors. */
  sectionBookmarks?: ReactNode;
  /** When provided (BlockNote-backed stages: ODD, IC Memo), renders a horizontal
   *  zoom control pinned to the bottom of the rail. */
  zoom?: ReportZoomControls;
}

export function ProjectStageRail({ reportLevel, onReportLevelChange, bookmarks, sectionBookmarks, zoom }: ProjectStageRailProps) {
  const levels: Level[] = ["L1", "L2", "ODD", "L3"];
  const levelMeta: Record<Level, { label: string; display: string; available: boolean }> = {
    L1: { label: "Triage Report", display: "Triage", available: true },
    L2: { label: "IDD (coming soon)", display: "IDD", available: false },
    ODD: { label: "Operational Due Diligence", display: "ODD", available: true },
    L3: { label: "IC Memo", display: "IC Memo", available: true },
  };

  // Local accordion state per stage. The currently-active stage is auto-
  // expanded when it has children, but the user can independently toggle any
  // stage open/closed without triggering navigation. Only clicking the stage
  // label changes the page.
  const [expanded, setExpanded] = useState<Record<Level, boolean>>({
    L1: true,
    L2: false,
    ODD: true,
    L3: true,
  });

  // Keep the active stage expanded automatically when the user navigates.
  useEffect(() => {
    setExpanded((prev) => (prev[reportLevel] ? prev : { ...prev, [reportLevel]: true }));
  }, [reportLevel]);

  return (
    <div className="hidden lg:flex shrink-0 flex-col py-4 px-2 w-56 gap-2 border-r border-border/50 h-full">
      <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground/70">
        Report Stage
      </div>
      <nav aria-label="Report stage" className="flex flex-col gap-0.5">
        {levels.map((lvl) => {
          const { label, display, available } = levelMeta[lvl];
          const isActive = reportLevel === lvl;
          // Children are only available for the active stage (the rail only
          // knows about the current page's bookmarks). Inactive stages can
          // still be clicked to navigate, but have no preview accordion.
          const childrenAvailable =
            (lvl === "L1" && !!bookmarks) ||
            ((lvl === "ODD" || lvl === "L3") && isActive && !!sectionBookmarks);
          const isOpen = childrenAvailable && expanded[lvl];
          const inlineChildren = isOpen
            ? lvl === "L1"
              ? bookmarks
              : sectionBookmarks
            : null;
          // Parents with no children visible still highlight on active.
          const showActiveBg = isActive && !inlineChildren;
          const Leading = !available ? Lock : isOpen ? ChevronDown : ChevronRight;
          const toggleExpanded = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!childrenAvailable) return;
            setExpanded((prev) => ({ ...prev, [lvl]: !prev[lvl] }));
          };
          return (
            <div key={lvl}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "group flex w-full items-center rounded-md text-sm transition-colors",
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "text-sidebar-accent-foreground font-medium",
                      showActiveBg && "bg-sidebar-accent",
                      !available && "opacity-50",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <button
                      type="button"
                      onClick={toggleExpanded}
                      disabled={!available || !childrenAvailable}
                      aria-label={isOpen ? `Collapse ${display}` : `Expand ${display}`}
                      aria-expanded={isOpen}
                      tabIndex={childrenAvailable ? 0 : -1}
                      className={cn(
                        "flex items-center justify-center pl-2 pr-1 py-1.5 rounded-l-md",
                        childrenAvailable && available
                          ? "cursor-pointer hover:text-sidebar-accent-foreground"
                          : "cursor-default",
                      )}
                    >
                      <Leading className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </button>
                    <button
                      type="button"
                      onClick={() => available && onReportLevelChange(lvl)}
                      disabled={!available}
                      className={cn(
                        "flex-1 min-w-0 text-left pr-2 py-1.5 rounded-r-md truncate",
                        !available && "cursor-not-allowed",
                      )}
                    >
                      <span className="truncate">{display}</span>
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
              {inlineChildren && (
                <div className="mt-0.5 mb-1 ml-[15px] border-l border-sidebar-border/70 pl-2 py-0.5">
                  {inlineChildren}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      {zoom && (
        <div className="mt-auto flex items-center justify-center gap-0.5 rounded-md border border-border bg-card px-1 py-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={zoom.zoomOut}
                disabled={zoom.canOut === false}
                aria-label="Zoom out"
                className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom out</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={zoom.reset}
                className="min-w-[2.75rem] px-1 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground hover:text-foreground transition-colors"
              >
                {Math.round(zoom.zoom * 100)}%
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Reset zoom</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={zoom.zoomIn}
                disabled={zoom.canIn === false}
                aria-label="Zoom in"
                className="inline-flex items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Zoom in</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
