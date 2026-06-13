import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

type Level = "L1" | "L2" | "L3" | "ODD";

interface ProjectStageRailProps {
  reportLevel: Level;
  onReportLevelChange: (level: Level) => void;
  bookmarks?: ReactNode;
}

export function ProjectStageRail({ reportLevel, onReportLevelChange, bookmarks }: ProjectStageRailProps) {
  const levels: Level[] = ["L1", "L2", "ODD", "L3"];
  const levelMeta: Record<Level, { label: string; display: string; available: boolean }> = {
    L1: { label: "Triage Report", display: "Triage", available: true },
    L2: { label: "IDD (coming soon)", display: "IDD", available: false },
    ODD: { label: "Operational Due Diligence", display: "ODD", available: true },
    L3: { label: "IC Memo", display: "IC Memo", available: true },
  };

  return (
    <div className="hidden lg:flex shrink-0 flex-col py-6 px-4 w-auto gap-3 border-r border-border/50">
      <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Report Stage
      </div>
      <Tabs
        value={reportLevel}
        onValueChange={(v) => {
          const next = v as Level;
          if (levelMeta[next]?.available) onReportLevelChange(next);
        }}
        orientation="vertical"
        aria-label="Report stage"
      >
        <TabsList className="flex h-auto flex-col items-stretch gap-1.5 bg-transparent p-0 w-full">
        {levels.map((lvl) => {
          const { label, display, available } = levelMeta[lvl];
          const isActive = reportLevel === lvl;
          const hasChildren = lvl === "L1" && !!bookmarks;
          // When a parent (L1/Triage) has visible children, the active highlight lives on the child row,
          // so we suppress the pill on the parent to avoid double-highlighting.
          const showActivePill = isActive && !hasChildren;
          return (
            <div key={lvl} className="contents">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value={lvl}
                    disabled={!available}
                    className={cn(
                      "w-full justify-start gap-1.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide rounded-md text-muted-foreground transition-colors",
                      "hover:bg-muted hover:text-foreground",
                      isActive && "text-foreground",
                      showActivePill && "bg-muted",
                      !available && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                    )}
                  >
                    {!available && <Lock className="h-3 w-3" />}
                    {display}
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
              {lvl === "L1" && reportLevel === "L1" && bookmarks && (
                <div className="pl-3 mt-0.5 mb-1 border-l border-border/60 ml-3">
                  {bookmarks}
                </div>
              )}
            </div>
          );
        })}
        </TabsList>
      </Tabs>
    </div>
  );
}
