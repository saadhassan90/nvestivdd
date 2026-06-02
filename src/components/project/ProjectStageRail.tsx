import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    <nav
      aria-label="Report stage"
      className="hidden lg:flex shrink-0 flex-col gap-1 py-4 px-2 w-14"
    >
      {levels.map((lvl) => {
        const active = reportLevel === lvl;
        const { label, display, available } = levelMeta[lvl];
        return (
          <Tooltip key={lvl}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => available && onReportLevelChange(lvl)}
                disabled={!available}
                className={cn(
                  "inline-flex items-center justify-center gap-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  !available && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                )}
              >
                {!available && <Lock className="h-2.5 w-2.5" />}
                {display}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
