/**
 * L1 PRD v2.0 §7.3 — Composite recalc with Insufficient Data renormalization.
 *
 * The 5 scored dimensions and their PRD weights (Phase 4.2):
 *   investment_thesis 15
 *   market_reality    20
 *   team              25
 *   track_record      20
 *   economics         20
 *                  ────
 *                   100
 *
 * `regulatory_ops` is NOT in the composite (Pass / Conditional / Fail only;
 * feeds Hard Floors).
 *
 * Renormalization rule: any section flagged Insufficient Data (null score, or
 * score <= 0) is REMOVED from both numerator and denominator. The remaining
 * weights are renormalized to sum to 1.0.
 *
 *   Worked example (PRD): 4 sections at 7.0 + 1 ID
 *      = 70/100 (NOT 56/100).
 *
 * If ALL five dimensions are Insufficient Data, composite is null.
 */

export const DIMENSION_WEIGHTS: Record<string, number> = {
  investment_thesis: 15,
  market_reality: 20,
  team: 25,
  track_record: 20,
  economics: 20,
};

export const DIMENSION_LABELS: Record<string, string> = {
  investment_thesis: "Investment Thesis",
  market_reality: "Macro Context",
  team: "Team & Manager",
  track_record: "Track Record",
  economics: "Economics",
};

export interface ModuleScoreInput {
  module_key: string;
  /** Section-level 1–10 score, or null/<=0 for Insufficient Data. */
  score: number | null | undefined;
}

export interface CompositeResult {
  /** 1–100 composite (renormalized), or null if every dimension is ID. */
  composite: number | null;
  /** Number of dimensions used (out of 5). */
  used: number;
  /** Dimensions excluded due to Insufficient Data. */
  excluded: string[];
  /** Did renormalization apply (i.e., at least one ID exclusion)? */
  renormalized: boolean;
}

/**
 * Compute composite from an array of module scores. Section scores are 1–10;
 * we scale to 0–100 by multiplying by 10 before applying weights.
 */
export function computeComposite(scores: ModuleScoreInput[]): CompositeResult {
  const byKey = new Map<string, number | null>();
  for (const s of scores) {
    if (DIMENSION_WEIGHTS[s.module_key] == null) continue; // ignore non-composite (e.g. regulatory_ops)
    const v = s.score == null || s.score <= 0 ? null : s.score;
    byKey.set(s.module_key, v);
  }

  const keys = Object.keys(DIMENSION_WEIGHTS);
  const used: string[] = [];
  const excluded: string[] = [];
  let weightedSum = 0;
  let weightTotal = 0;

  for (const k of keys) {
    const w = DIMENSION_WEIGHTS[k];
    const score = byKey.get(k);
    if (score == null) {
      excluded.push(k);
      continue;
    }
    used.push(k);
    // section score 1–10 -> /10 -> 0–1, * 100 = scaled. Weighted by w.
    weightedSum += (score / 10) * 100 * w;
    weightTotal += w;
  }

  if (weightTotal === 0) {
    return { composite: null, used: 0, excluded, renormalized: false };
  }

  const composite = Math.round(weightedSum / weightTotal);
  return {
    composite,
    used: used.length,
    excluded,
    renormalized: excluded.length > 0,
  };
}

/**
 * Apply Phase 7.3 auto-Defer rule: if completeness < 30%, force `defer`
 * regardless of composite. Hard Floor still wins (forces `decline`).
 * Returns `null` if no override applies; caller falls back to score band.
 */
export function autoDeferGate(opts: {
  completenessPct?: number | null;
  hardFloorTriggered?: boolean;
}): "decline" | "defer" | null {
  if (opts.hardFloorTriggered) return "decline";
  if (opts.completenessPct != null && opts.completenessPct < 30) return "defer";
  return null;
}