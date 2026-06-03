import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

type Level = "L1" | "L2" | "L3" | "ODD";

interface ProjectStageRailProps {
  reportLevel: Level;
  onReportLevelChange: (level: Level) => void;
}

export function ProjectStageRail({ reportLevel, onReportLevelChange }: ProjectStageRailProps) {
  const levels: Level[] = ["L1", "L2", "ODD", "L3"];
  const levelMeta: Record<Level, { label: string; display: string; available: boolean }> = {
    L1: { label: "Triage Report", display: "Triage", available: true },
    L2: { label: "IDD (coming soon)", display: "IDD", available: false },
    ODD: { label: "Operational Due Diligence", display: "ODD", available: true },
    L3: { label: "IC Memo", display: "IC Memo", available: true },
  };

  return (
    <Tabs
      value={reportLevel}
      onValueChange={(v) => {
        const next = v as Level;
        if (levelMeta[next]?.available) onReportLevelChange(next);
      }}
      orientation="vertical"
      className="hidden lg:block shrink-0 py-6 px-3"
      aria-label="Report stage"
    >
      <TabsList className="flex h-auto flex-col items-stretch gap-1 bg-transparent p-0 w-28">
        {levels.map((lvl) => {
          const { label, display, available } = levelMeta[lvl];
          return (
            <Tooltip key={lvl}>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value={lvl}
                  disabled={!available}
                  className={cn(
                    "w-full justify-start gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wide rounded-md text-muted-foreground transition-colors",
                    "hover:bg-muted hover:text-foreground",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                    !available && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                  )}
                >
                  {!available && <Lock className="h-3 w-3" />}
                  {display}
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
