import { Loader2, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ODD_SECTIONS, type OddSectionKey } from "@/lib/odd-template";

export type OddSectionStatusUi = "unverified" | "generating" | "verified" | "flagged" | "error";

export type RiskRating = "low" | "medium" | "high" | null;

interface OddLeftRailProps {
  sectionStatuses: Record<OddSectionKey, OddSectionStatusUi>;
  activeKey?: OddSectionKey | null;
  onSectionClick: (key: OddSectionKey) => void;
  riskRating: RiskRating;
}

function StatusChip({ status }: { status: OddSectionStatusUi }) {
  switch (status) {
    case "generating":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating
        </span>
      );
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-score-strong">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </span>
      );
    case "flagged":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-severity-critical">
          <AlertTriangle className="h-3 w-3" />
          Flagged
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-severity-critical">
          <AlertTriangle className="h-3 w-3" />
          Error
        </span>
      );
    case "unverified":
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/70">
          <Circle className="h-3 w-3" />
          Unverified
        </span>
      );
  }
}

function RiskRatingBlock({ rating }: { rating: RiskRating }) {
  if (!rating) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="text-[10px] font-bold text-muted-foreground mb-1">
          Risk Rating
        </div>
        <div className="text-2xl font-bold text-muted-foreground">—</div>
      </div>
    );
  }
  const color =
    rating === "low"
      ? "text-score-strong"
      : rating === "medium"
        ? "text-score-review"
        : "text-severity-critical";
  const dot =
    rating === "low"
      ? "bg-score-strong"
      : rating === "medium"
        ? "bg-score-review"
        : "bg-severity-critical";
  const label = rating[0].toUpperCase() + rating.slice(1);
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="text-[10px] font-bold text-muted-foreground mb-1">
        Risk Rating
      </div>
      <div className={cn("flex items-center gap-2 text-lg font-bold", color)}>
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </div>
    </div>
  );
}

export function OddLeftRail({
  sectionStatuses,
  activeKey,
  onSectionClick,
  riskRating,
}: OddLeftRailProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[220px] shrink-0 border-r border-border bg-card/40">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[10px] font-bold text-muted-foreground">
          ODD Sections
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {ODD_SECTIONS.map((s) => {
          const status = sectionStatuses[s.key] ?? "unverified";
          const isActive = activeKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSectionClick(s.key)}
              className={cn(
                "w-full flex flex-col items-start gap-1 px-4 py-2.5 text-left transition-colors border-l-2",
                isActive
                  ? "border-foreground bg-muted/60"
                  : "border-transparent hover:bg-muted/40",
              )}
            >
              <span className="text-xs font-medium text-foreground leading-tight">{s.title}</span>
              <StatusChip status={status} />
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <RiskRatingBlock rating={riskRating} />
      </div>
    </aside>
  );
}