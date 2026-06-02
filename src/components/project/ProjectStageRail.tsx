import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiVariant } from "@/contexts/UiVariantContext";
import { cn } from "@/lib/utils";

type Level = "L1" | "L2" | "L3" | "ODD";

interface ProjectStageRailProps {
  reportLevel: Level;
  onReportLevelChange: (level: Level) => void;
}

export function ProjectStageRail({ reportLevel, onReportLevelChange }: ProjectStageRailProps) {
  const { variant } = useUiVariant();
  const isAdia = variant === "adia";
  const levels: Level[] = isAdia ? ["L1", "L2", "ODD", "L3"] : ["L1", "L2", "L3"];
  const levelMeta: Record<Level, { label: string; available: boolean }> = {
    L1: {
      label: isAdia ? "L1 — Locked in ADIA demo" : "L1 — Triage Report",
      available: !isAdia,
    },
    L2: {
      label: isAdia ? "L2 — Locked in ADIA demo" : "L2 — Deep Dive (coming soon)",
      available: false,
    },
    ODD: { label: "ODD — Operational Due Diligence", available: isAdia },
    L3: {
      label: isAdia ? "L3 — Locked in ADIA demo" : "L3 — IC Memo",
      available: !isAdia,
    },
  };

  return (
    <nav
      aria-label="Report stage"
      className="hidden lg:flex shrink-0 flex-col gap-1 py-4 px-2 w-14"
    >
      {levels.map((lvl) => {
        const active = reportLevel === lvl;
        const { label, available } = levelMeta[lvl];
        return (
          <Tooltip key={lvl}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => available && onReportLevelChange(lvl)}
                disabled={!available}
                className={cn(
                  "inline-flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  !available && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                )}
              >
                {!available && <Lock className="h-2.5 w-2.5" />}
                {lvl}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}