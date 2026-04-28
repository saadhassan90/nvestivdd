import { Globe } from "lucide-react";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.3 — Geography Map
 *
 * Region-level capital allocation. Designed as a typed list/heat-bar — the
 * SVG world-map visualization lands later; the data shape and skeleton
 * stabilise here so the synthesis pipeline (Phase 7.4) has a target.
 *
 * Region taxonomy (PRD-fixed):
 *  - North America · Europe · UK · Asia-Pacific · LatAm · MENA · Africa · Global
 */

export type GeoRegion =
  | "North America"
  | "Europe"
  | "UK"
  | "Asia-Pacific"
  | "LatAm"
  | "MENA"
  | "Africa"
  | "Global";

export type GeoSlice = {
  region: GeoRegion | string;
  /** 0–100 share of capital. */
  pct: number;
  /** Optional country/sub-region detail, e.g. "US 60% · Canada 10%". */
  detail?: string | null;
};

const REGION_ORDER: GeoRegion[] = [
  "North America",
  "Europe",
  "UK",
  "Asia-Pacific",
  "LatAm",
  "MENA",
  "Africa",
  "Global",
];

interface GeographyMapProps {
  slices: GeoSlice[];
  /** Stated mandate, e.g. "Pan-European mid-market". Drives mismatch flag. */
  statedMandate?: string | null;
}

function heatClass(pct: number): string {
  if (pct >= 50) return "bg-foreground";
  if (pct >= 30) return "bg-foreground/70";
  if (pct >= 15) return "bg-foreground/50";
  if (pct >= 5) return "bg-foreground/30";
  if (pct > 0) return "bg-foreground/15";
  return "bg-muted";
}

export function GeographyMap({ slices, statedMandate }: GeographyMapProps) {
  // Order canonical regions first (only those present), then any custom regions.
  const map = new Map(slices.map((s) => [s.region, s]));
  const ordered = [
    ...REGION_ORDER.filter((r) => map.has(r)).map((r) => map.get(r)!),
    ...slices.filter((s) => !REGION_ORDER.includes(s.region as GeoRegion)),
  ];

  return (
    <SectionCard
      title="Geography"
      subtitle={`Regional capital allocation${statedMandate ? ` · Mandate: ${statedMandate}` : ""}`}
      icon={<Globe className="h-4 w-4" />}
      empty={ordered.length === 0}
      emptyMessage="Geographic breakdown not yet emitted by Phase 7.4 synthesis (geography_breakdown[])."
    >
      {ordered.length > 0 && (
        <div className="space-y-1.5">
          {ordered.map((s) => (
            <div
              key={s.region}
              className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-xs py-1"
            >
              <span className="text-foreground font-medium truncate">{s.region}</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", heatClass(s.pct))}
                    style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                  />
                </div>
                {s.detail && (
                  <span className="text-[10px] text-muted-foreground italic truncate max-w-[40%]">
                    {s.detail}
                  </span>
                )}
              </div>
              <span className="tabular-nums font-bold text-foreground text-right">
                {s.pct.toFixed(1)}%
              </span>
            </div>
          ))}
          <p className="text-[10px] italic text-muted-foreground pt-2">
            SVG world-map visualization lands in Phase 6.3b. Data shape stabilised here
            (region · pct · detail) so synthesis can target it now.
          </p>
        </div>
      )}
    </SectionCard>
  );
}