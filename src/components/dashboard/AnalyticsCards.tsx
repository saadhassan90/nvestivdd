import { NumberTicker } from "@/components/magicui/NumberTicker";
import { BlurFade } from "@/components/magicui/BlurFade";
import { KpiRow, KpiCell } from "@/components/ui/kpi";
import type { Tables } from "@/integrations/supabase/types";

interface AnalyticsCardsProps {
  projects: Tables<"projects">[];
  flagCount?: number;
}

export function AnalyticsCards({ projects }: AnalyticsCardsProps) {
  const total = projects.length;
  const completed = projects.filter(p => p.status === "complete").length;
  const processing = projects.filter(p =>
    ["pending", "uploading", "processing", "analyzing", "extracting"].includes(p.status)
  ).length;
  const failed = projects.filter(p => p.status === "failed").length;

  // L1 PRD §6.5 — average completeness across completed deals (null-safe).
  const completenessSamples = projects
    .map((p) => (p as { completeness_pct?: number | null }).completeness_pct)
    .filter((v): v is number => typeof v === "number");
  const avgCompleteness = completenessSamples.length
    ? Math.round(completenessSamples.reduce((a, b) => a + b, 0) / completenessSamples.length)
    : null;

  const cards = [
    { label: "Total funds", value: total },
    { label: "Completed", value: completed },
    { label: "Processing", value: processing },
    { label: "Failed", value: failed },
    {
      label: "Avg confidence",
      value: avgCompleteness ?? 0,
      suffix: avgCompleteness == null ? "—" : "%",
    },
  ];

  return (
    <>
      {/* Desktop */}
      <BlurFade className="hidden sm:block">
        <KpiRow className="grid-cols-2 sm:grid-cols-5 lg:grid-cols-5">
          {cards.map((card) => {
            const suffix = (card as { suffix?: string }).suffix;
            const value =
              suffix === "—" ? (
                "—"
              ) : (
                <>
                  <NumberTicker value={card.value} />
                  {suffix === "%" && <span className="text-base ml-0.5">%</span>}
                </>
              );
            return <KpiCell key={card.label} label={card.label} value={value} />;
          })}
        </KpiRow>
      </BlurFade>

      {/* Mobile: compact 5-col */}
      <BlurFade>
        <div className="sm:hidden grid grid-cols-5 gap-1.5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-md border border-border bg-card px-2 py-1.5">
              <p className="text-[9px] font-medium text-muted-foreground leading-tight truncate">
                {card.label}
              </p>
              <div className="flex items-baseline gap-0.5 mt-0.5">
                <span className="text-sm font-semibold text-foreground leading-none">
                  {(card as { suffix?: string }).suffix === "—"
                    ? "—"
                    : `${card.value}${(card as { suffix?: string }).suffix ?? ""}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </BlurFade>
    </>
  );
}
