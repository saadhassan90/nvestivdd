/**
 * L1 PRD v2.0 §7.2 — Static benchmark database lookup.
 *
 * 4-level fallback (most-specific → most-generic):
 *   1. {assetClass}::{subAssetClass}::{marketSegment}
 *   2. {assetClass}::{subAssetClass}::all
 *   3. {assetClass}::*::{marketSegment}     (if marketSegment maps to a segment-only row)
 *   4. {assetClass}::*::all                  (asset-class default)
 *
 * Returns the first match, with `match_level` describing how generic the
 * fallback was. Caller should display a "stale" or "approximate" qualifier
 * when match_level > 1.
 */
import { supabase } from "@/integrations/supabase/client";

export interface BenchmarkRecord {
  id: string;
  asset_class: string;
  sub_asset_class: string;
  market_segment: string;
  vintage_range: string | null;
  sector_dynamics: any;
  vintage_performance: any;
  term_standards: any;
  sources: string[];
  version: string;
  is_stale: boolean;
  match_level: 1 | 2 | 3 | 4;
}

export interface BenchmarkLookupKey {
  assetClass?: string | null;
  subAssetClass?: string | null;
  marketSegment?: string | null;
}

function norm(s: string | null | undefined): string | null {
  if (!s) return null;
  return s.toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
}

/**
 * Best-match benchmark with progressive fallback. Returns null if no match.
 */
export async function lookupBenchmark(
  key: BenchmarkLookupKey,
): Promise<BenchmarkRecord | null> {
  const ac = norm(key.assetClass);
  const sac = norm(key.subAssetClass);
  const seg = norm(key.marketSegment);

  if (!ac) return null;

  const { data, error } = await supabase
    .from("benchmarks" as any)
    .select("*")
    .eq("asset_class", ac);

  if (error || !data || data.length === 0) return null;

  const rows = data as any[];

  // Level 1: exact triple
  if (sac && seg) {
    const m = rows.find((r) => r.sub_asset_class === sac && r.market_segment === seg);
    if (m) return { ...m, match_level: 1 };
  }
  // Level 2: same sub_asset_class, segment "all"
  if (sac) {
    const m = rows.find((r) => r.sub_asset_class === sac && r.market_segment === "all");
    if (m) return { ...m, match_level: 2 };
    // fall back to any row matching the sub_asset_class
    const any = rows.find((r) => r.sub_asset_class === sac);
    if (any) return { ...any, match_level: 2 };
  }
  // Level 3: any sub_asset_class but matching segment
  if (seg) {
    const m = rows.find((r) => r.market_segment === seg);
    if (m) return { ...m, match_level: 3 };
  }
  // Level 4: asset-class default — pick the first
  return { ...rows[0], match_level: 4 };
}

export function describeMatchLevel(level: number): string {
  switch (level) {
    case 1: return "Exact match";
    case 2: return "Sub-asset-class match";
    case 3: return "Segment-only match";
    case 4: return "Asset-class default (approximate)";
    default: return "—";
  }
}