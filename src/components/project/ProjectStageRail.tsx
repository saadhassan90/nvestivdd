import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FileText, ClipboardList, Building2, ScrollText, Lock, ZoomIn, ZoomOut } from "lucide-react";
import type { ReactNode } from "react";
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
  const levelMeta: Record<Level, { label: string; display: string; available: boolean; icon: typeof FileText }> = {
    L1: { label: "Triage Report", display: "Triage", available: true, icon: FileText },
    L2: { label: "IDD (coming soon)", display: "IDD", available: false, icon: ClipboardList },
    ODD: { label: "Operational Due Diligence", display: "ODD", available: true, icon: Building2 },
    L3: { label: "IC Memo", display: "IC Memo", available: true, icon: ScrollText },
  };

  return (
    <div className="hidden lg:flex shrink-0 flex-col py-4 px-2 w-56 gap-2 border-r border-border/50 h-full">
      <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground/70">
        Report Stage
      </div>
      <nav aria-label="Report stage" className="flex flex-col gap-0.5">
        {levels.map((lvl) => {
          const { label, display, available, icon: Icon } = levelMeta[lvl];
          const isActive = reportLevel === lvl;
          const inlineChildren =
            lvl === "L1" && bookmarks
              ? bookmarks
              : (lvl === "ODD" || lvl === "L3") && isActive && sectionBookmarks
                ? sectionBookmarks
                : null;
          const hasChildren = !!inlineChildren;
          const showActiveBg = isActive && !hasChildren;
          return (
            <div key={lvl}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => available && onReportLevelChange(lvl)}
                    disabled={!available}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "text-sidebar-accent-foreground font-medium",
                      showActiveBg && "bg-sidebar-accent",
                      !available && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-sidebar-foreground/80",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{display}</span>
                    {!available && <Lock className="ml-auto h-3 w-3 opacity-60" />}
                  </button>
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
