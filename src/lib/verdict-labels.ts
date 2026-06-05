/**
 * Plain-language verdict + benchmark labels for L1 scores.
 *
 * Composite verdicts (out of 100) and module verdicts (out of 10) follow the
 * v2.0 vocabulary: Take the meeting / Take with conditions / Defer / Decline.
 * Module level adds an Above-average / Average / Below-average benchmark tag.
 */

export type VerdictKind =
  | "advance"
  | "advance_conditional"
  | "defer"
  | "decline"
  | "insufficient";

export interface CompositeVerdict {
  kind: VerdictKind;
  headline: string;
  detail: string;
}

export function compositeVerdict(score100: number | null | undefined): CompositeVerdict {
  if (score100 == null) {
    return {
      kind: "insufficient",
      headline: "Insufficient data — gather more before deciding",
      detail: "Composite cannot be calibrated until the missing inputs land.",
    };
  }
  if (score100 >= 80) {
    return {
      kind: "advance",
      headline: "Take the meeting — strong fit across the rubric",
      detail: "Top-quartile composite; advance to L2 with full diligence.",
    };
  }
  if (score100 >= 65) {
    return {
      kind: "advance_conditional",
      headline: "Take the meeting — conditional on resolving named gaps",
      detail: "Above the bar but specific risks need to be probed live.",
    };
  }
  if (score100 >= 50) {
    return {
      kind: "defer",
      headline: "Defer — material gaps outweigh strengths today",
      detail: "Re-evaluate once data-room asks are returned; do not take meeting now.",
    };
  }
  return {
    kind: "decline",
    headline: "Decline — composite below the institutional floor",
    detail: "Hard issues across multiple dimensions. Pass.",
  };
}

export type BenchmarkLabel = "above_average" | "average" | "below_average" | "insufficient";

export const BENCHMARK_LABEL_TEXT: Record<BenchmarkLabel, string> = {
  above_average: "Above average",
  average: "Average",
  below_average: "Below average",
  insufficient: "Insufficient data",
};

export function moduleBenchmark(score10: number | null | undefined): BenchmarkLabel {
  if (score10 == null) return "insufficient";
  if (score10 >= 7) return "above_average";
  if (score10 >= 5) return "average";
  return "below_average";
}

export function moduleVerdictLine(score10: number | null | undefined): string {
  const bench = moduleBenchmark(score10);
  switch (bench) {
    case "above_average":
      return "Strength to lean on — surface this in the meeting.";
    case "average":
      return "Acceptable but not a differentiator — keep probing.";
    case "below_average":
      return "Weakness — must be resolved before advancing.";
    case "insufficient":
      return "Not enough signal to grade this dimension yet.";
  }
}

/** Quartile labels for Track Record when vintage benchmark data is available. */
export function quartileLabel(quartile: 1 | 2 | 3 | 4 | null | undefined): string {
  if (quartile == null) return "Benchmark: insufficient data";
  const map = { 1: "First quartile", 2: "Second quartile", 3: "Third quartile", 4: "Fourth quartile" } as const;
  return map[quartile];
}