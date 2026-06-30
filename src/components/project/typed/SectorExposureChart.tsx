import { PieChart } from "lucide-react";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.2 — Sector Exposure Chart
 *
 * Horizontal-bar breakdown of fund / track-record sector mix.
 * Each row: sector label · % of capital · concentration flag.
 *
 * Concentration flags (PRD-defined):
 *  - balanced     ≤ 25%
 *  - tilted       25–40%
 *  - concentrated 40–60%
 *  - single-bet   > 60%
 */

export type SectorSlice = {
  sector: string;
  /** Share of capital, expressed as 0–100. */
  pct: number;
  /** Optional secondary metric, e.g. "8 deals" or "$420M". */
  meta?: string | null;
};

interface SectorExposureChartProps {
  slices: SectorSlice[];
  /** Total capital denomination, e.g. "of $1.2B fund" — purely descriptive. */
  denominator?: string | null;
}

function classify(pct: number): { label: string; cls: string } {
  if (pct > 60) return { label: "Single-bet", cls: "border-severity-critical/40 text-severity-critical bg-severity-critical/10" };
  if (pct >= 40) return { label: "Concentrated", cls: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10" };
  if (pct >= 25) return { label: "Tilted", cls: "border-score-review/40 text-score-review bg-score-review/10" };
  return { label: "Balanced", cls: "border-score-strong/40 text-score-strong bg-score-strong/10" };
}

export function SectorExposureChart({ slices, denominator }: SectorExposureChartProps) {
  // Sort descending for visual hierarchy.
  const sorted = [...slices].sort((a, b) => b.pct - a.pct);
  const top = sorted[0];
  const overallFlag = top ? classify(top.pct) : null;

  return (
    <SectionCard
      title="Sector Exposure"
      subtitle={`Capital allocation across sectors${denominator ? ` · ${denominator}` : ""}`}
      icon={<PieChart className="h-4 w-4" />}
      actions={
        overallFlag && (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
              overallFlag.cls,
            )}
          >
            {overallFlag.label}
          </span>
        )
      }
      empty={sorted.length === 0}
      emptyMessage="Sector exposure not yet emitted by Phase 7.4 synthesis (sector_breakdown[])."
    >
      {sorted.length > 0 && (
        <div className="space-y-2.5">
          {sorted.map((s) => {
            const flag = classify(s.pct);
            return (
              <div key={s.sector} className="text-xs">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-foreground font-medium truncate">{s.sector}</span>
                    {s.meta && (
                      <span className="text-[10px] text-muted-foreground italic truncate">{s.meta}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="tabular-nums font-bold text-foreground">
                      {s.pct.toFixed(1)}%
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold",
                        flag.cls,
                      )}
                    >
                      {flag.label}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      s.pct > 60
                        ? "bg-severity-critical"
                        : s.pct >= 40
                          ? "bg-severity-elevated"
                          : s.pct >= 25
                            ? "bg-score-review"
                            : "bg-score-strong",
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}