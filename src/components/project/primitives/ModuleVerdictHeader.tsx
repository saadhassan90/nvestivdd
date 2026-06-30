import { cn } from "@/lib/utils";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import {
  BENCHMARK_LABEL_TEXT,
  moduleBenchmark,
  moduleVerdictLine,
} from "@/lib/verdict-labels";

/**
 * Drop-in replacement for the per-module ScoreHeader. Renders the 1–10 score,
 * tier pill, Above/Average/Below-average benchmark label, and a one-line
 * plain-language verdict so the number is never naked.
 */
interface ModuleVerdictHeaderProps {
  score10: number | null;
  /** Optional override for the verdict line (per-module synthesis can supply). */
  verdictLine?: string | null;
  className?: string;
}

const TIER_CLASS: Record<ScoreTier, string> = {
  exceptional: "border-score-strong/40 text-score-strong bg-score-strong/10",
  strong: "border-score-strong/40 text-score-strong bg-score-strong/10",
  adequate: "border-score-advance/40 text-score-advance bg-score-advance/10",
  below_average: "border-score-review/40 text-score-review bg-score-review/10",
  concerning: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
  insufficient_data: "border-dashed border-border text-muted-foreground bg-muted/30",
};

const BENCH_CLASS: Record<ReturnType<typeof moduleBenchmark>, string> = {
  above_average: "border-score-strong/40 text-score-strong bg-score-strong/10",
  average: "border-score-advance/40 text-score-advance bg-score-advance/10",
  below_average: "border-score-review/40 text-score-review bg-score-review/10",
  insufficient: "border-dashed border-border text-muted-foreground bg-muted/30",
};

export function ModuleVerdictHeader({ score10, verdictLine, className }: ModuleVerdictHeaderProps) {
  const tier = getSectionTier(score10);
  const bench = moduleBenchmark(score10);
  const line = verdictLine ?? moduleVerdictLine(score10);
  return (
    <div className={cn("flex flex-col items-end gap-1 min-w-0", className)}>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="flex items-baseline gap-0.5 tabular-nums">
          <span className="text-2xl font-bold text-foreground">
            {score10 != null ? score10.toFixed(1) : "─"}
          </span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
            TIER_CLASS[tier],
          )}
        >
          {SCORE_TIER_LABELS[tier]}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            BENCH_CLASS[bench],
          )}
        >
          {BENCHMARK_LABEL_TEXT[bench]}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground italic leading-snug text-right max-w-xs">
        {line}
      </p>
    </div>
  );
}