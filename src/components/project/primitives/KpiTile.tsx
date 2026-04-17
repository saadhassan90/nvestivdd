import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyChip } from "./EmptyChip";

interface KpiTileProps {
  label: string;
  value: string | number | null | undefined;
  subValue?: string;
  tone?: "default" | "good" | "warn" | "bad" | "neutral";
  icon?: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  default: "text-foreground",
  good: "text-score-strong",
  warn: "text-severity-elevated",
  bad: "text-severity-critical",
  neutral: "text-muted-foreground",
};

export function KpiTile({ label, value, subValue, tone = "default", icon, className }: KpiTileProps) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("rounded-lg border border-border bg-card px-3.5 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        {icon && <span className="text-muted-foreground/60 shrink-0">{icon}</span>}
      </div>
      <div className="mt-1.5">
        {empty ? (
          <EmptyChip />
        ) : (
          <p className={cn("text-xl font-bold tabular-nums leading-tight", TONE_CLASSES[tone])}>{value}</p>
        )}
        {subValue && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subValue}</p>}
      </div>
    </div>
  );
}
