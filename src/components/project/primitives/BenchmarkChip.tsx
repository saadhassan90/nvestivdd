import { cn } from "@/lib/utils";
import {
  BENCHMARK_LABEL_TEXT,
  moduleBenchmark,
  type BenchmarkLabel,
} from "@/lib/verdict-labels";

/**
 * Compact benchmark indicator chip — Above average / Average / Below average /
 * Insufficient data. Accepts either an explicit label (Track Record passes
 * pre-computed quartile copy) or a 1–10 score that maps to the default labels.
 */
interface BenchmarkChipProps {
  score10?: number | null;
  label?: BenchmarkLabel;
  /** Optional override text — e.g. "Second quartile vs. 2021 Asia PE". */
  text?: string;
  className?: string;
}

const TONE: Record<BenchmarkLabel, string> = {
  above_average: "border-score-strong/40 text-score-strong bg-score-strong/10",
  average: "border-score-advance/40 text-score-advance bg-score-advance/10",
  below_average: "border-score-review/40 text-score-review bg-score-review/10",
  insufficient: "border-dashed border-border text-muted-foreground bg-muted/30",
};

export function BenchmarkChip({ score10, label, text, className }: BenchmarkChipProps) {
  const resolved = label ?? moduleBenchmark(score10);
  const display = text ?? `Benchmark: ${BENCHMARK_LABEL_TEXT[resolved]}`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        TONE[resolved],
        className,
      )}
    >
      {display}
    </span>
  );
}