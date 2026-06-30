import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.5 — Market Context Strip
 *
 * 4 KPI cards giving sector-wide context (NEVER fund-specific). Strip is
 * omitted entirely if no benchmark match is found. Each tile carries:
 *   value · delta · trend direction · benchmark window
 *
 * Tiles are PRD-fixed:
 *  1. Dry Powder Trend
 *  2. Deal Volume
 *  3. Multiple Compression (EV/EBITDA Δ)
 *  4. Exit Environment (DPI vintage avg)
 */

export type MarketTile = {
  key: "dry_powder" | "deal_volume" | "multiple_compression" | "exit_environment";
  label: string;
  value: string | null;
  /** Numeric delta vs comparison window, e.g. -12.4 (%). Drives trend icon. */
  delta?: number | null;
  /** Comparison-window descriptor, e.g. "vs prior 4 quarters". */
  window?: string | null;
  /** Optional formatter override for delta (default: signed % to 1dp). */
  deltaLabel?: string | null;
};

interface MarketContextStripProps {
  /** Sector / asset-class scope, e.g. "Buyout · Mid-market". Header only. */
  scope?: string | null;
  tiles: MarketTile[];
  /** Static benchmarks key for traceability — surfaced as helper text. */
  benchmarkKey?: string | null;
}

const DEFAULT_TILES: Array<Pick<MarketTile, "key" | "label" | "window">> = [
  { key: "dry_powder", label: "Dry Powder Trend", window: "vs prior 4 quarters" },
  { key: "deal_volume", label: "Deal Volume", window: "rolling 12-month" },
  { key: "multiple_compression", label: "Multiple Compression", window: "EV/EBITDA Δ" },
  { key: "exit_environment", label: "Exit Environment", window: "DPI vintage avg" },
];

function trend(delta: number | null | undefined) {
  if (delta == null || Number.isNaN(delta)) {
    return { icon: <Minus className="h-3 w-3" />, cls: "text-muted-foreground" };
  }
  if (delta > 0.5) return { icon: <TrendingUp className="h-3 w-3" />, cls: "text-score-strong" };
  if (delta < -0.5) return { icon: <TrendingDown className="h-3 w-3" />, cls: "text-severity-elevated" };
  return { icon: <Minus className="h-3 w-3" />, cls: "text-muted-foreground" };
}

function fmtDelta(t: MarketTile): string | null {
  if (t.deltaLabel) return t.deltaLabel;
  if (t.delta == null) return null;
  const sign = t.delta > 0 ? "+" : "";
  return `${sign}${t.delta.toFixed(1)}%`;
}

export function MarketContextStrip({ scope, tiles, benchmarkKey }: MarketContextStripProps) {
  const byKey = new Map(tiles.map((t) => [t.key, t]));
  const merged: MarketTile[] = DEFAULT_TILES.map((d) => {
    const found = byKey.get(d.key);
    return found ? { ...d, ...found } : { ...d, value: null };
  });

  // PRD: omit strip entirely when no tile carries a real value.
  const hasAnyValue = merged.some((t) => t.value != null);
  if (!hasAnyValue && !benchmarkKey) return null;

  return (
    <SectionCard
      title="Sector Dynamics"
      subtitle={`Market context strip${scope ? ` · ${scope}` : ""} · Never references the specific fund`}
      icon={<BarChart3 className="h-4 w-4" />}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {merged.map((t) => {
            const tr = trend(t.delta);
            const deltaText = fmtDelta(t);
            const filled = t.value != null;
            return (
              <div
                key={t.key}
                className={cn(
                  "rounded-md border p-3",
                  filled
                    ? "border-border bg-muted/10"
                    : "border-dashed border-border bg-muted/20",
                )}
              >
                <p className="text-[10px] text-muted-foreground font-semibold truncate">
                  {t.label}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p
                    className={cn(
                      "text-base font-bold tabular-nums",
                      filled ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t.value ?? "─"}
                  </p>
                  {deltaText && (
                    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums", tr.cls)}>
                      {tr.icon}
                      {deltaText}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{t.window}</p>
              </div>
            );
          })}
        </div>
        {benchmarkKey && (
          <p className="text-[10px] italic text-muted-foreground">
            Benchmark key:{" "}
            <code className="font-mono text-[10px] text-foreground/70">{benchmarkKey}</code>
          </p>
        )}
      </div>
    </SectionCard>
  );
}