import { useState } from "react";
import { TrendingUp, Layers, ToggleLeft, Maximize2, FileBarChart, ShieldCheck, BarChart3, BookOpenCheck, Scale, Shield, MessageSquare } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { FlagLane } from "@/components/project/primitives/FlagLane";
import type { Tables } from "@/integrations/supabase/types";

interface PerformanceTabProps {
  metrics: Tables<"performance_metrics">[];
  fees: Tables<"fee_structure">[];
  engagementCaseStudies: Tables<"engagement_case_studies">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
}

function findMetric(metrics: Tables<"performance_metrics">[], pattern: RegExp) {
  return metrics.find((m) => pattern.test(m.metric_name));
}

export function PerformanceTab({ metrics, engagementCaseStudies, redFlags = [], interrogatoryItems = [] }: PerformanceTabProps) {
  const [strategyOnly, setStrategyOnly] = useState(false);

  const netMoi = findMetric(metrics, /net.*moi|net.*tvpi/i);
  const netIrr = findMetric(metrics, /net.*irr/i);
  const grossMoi = findMetric(metrics, /gross.*moi|gross.*tvpi/i);
  const grossIrr = findMetric(metrics, /gross.*irr/i);

  const trackFlags = redFlags.filter((f) =>
    (f.module || f.source_module || "").toLowerCase().match(/track|performance|financial/),
  );
  const tCritical = trackFlags.filter((f) => f.severity === "critical");
  const tElevated = trackFlags.filter((f) => f.severity === "elevated");
  const tMonitor = trackFlags.filter((f) => f.severity === "monitor");

  const trackQuestions = interrogatoryItems.filter((q) =>
    (q.module || q.source_module || "").toLowerCase().match(/track|performance|financial/),
  );

  return (
    <div className="space-y-5">
      {/* Headline Metrics Strip */}
      <BlurFade>
        <SectionCard
          title="Headline Metrics"
          subtitle="Realized · simple-average track record"
          icon={<TrendingUp className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Net MOI" value={netMoi?.value ?? null} />
            <KpiTile label="Net IRR" value={netIrr?.value ?? null} />
            <KpiTile label="Gross MOI" value={grossMoi?.value ?? null} />
            <KpiTile label="Gross IRR" value={grossIrr?.value ?? null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Scale & Count Grid */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Scale & Count"
          subtitle="Committed · allocated · invested · co-invest count"
          icon={<Layers className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Committed", value: null },
              { label: "Allocated", value: null },
              { label: "Invested", value: null },
              { label: "Co-invest Count", value: null },
              { label: "Duration Realized (yrs)", value: null },
              { label: "Positive Realizations Since X", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* In-Strategy Breakdown */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="In-Strategy Breakdown"
          subtitle="Toggle: all realized vs in-strategy only"
          icon={<ToggleLeft className="h-4 w-4" />}
          actions={
            <button
              onClick={() => setStrategyOnly((s) => !s)}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1"
            >
              {strategyOnly ? "In-Strategy Only" : "All Realized"}
            </button>
          }
          empty
          emptyMessage="In-strategy breakdown not parsed at L1."
        />
      </BlurFade>

      {/* Multiple Expansion Panel */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Multiple Expansion"
          subtitle="Entry vs exit multiple expansion %"
          icon={<Maximize2 className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Entry Multiple (avg)", value: null },
              { label: "Exit Multiple (avg)", value: null },
              { label: "Expansion %", value: null, emphasis: true },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Securitizations / Placements */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Securitizations / Placements"
          subtitle="ABS / HEI deal-by-deal table"
          icon={<FileBarChart className="h-4 w-4" />}
          empty
          emptyMessage="No securitization or placement data at L1."
        />
      </BlurFade>

      {/* Investor Verification Panel */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Investor Verification"
          subtitle="Named LP investors with source / confidence"
          icon={<ShieldCheck className="h-4 w-4" />}
          empty
          emptyMessage="No named investors verified at L1."
        />
      </BlurFade>

      {/* Performance / Scale row */}
      <BlurFade delay={0.14}>
        <SectionCard
          title="Performance / Scale"
          subtitle="Total deployed · homeowner count · loss rate · Sharpe"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Total Deployed", value: null },
              { label: "Counterparty Count", value: null },
              { label: "Loss Rate", value: null },
              { label: "Sharpe Ratio", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Reconciliation Note */}
      <BlurFade delay={0.16}>
        <SectionCard
          title="Reconciliation Note"
          subtitle="Track record reconciliation source"
          icon={<BookOpenCheck className="h-4 w-4" />}
          empty
          emptyMessage="No reconciliation statement parsed at L1."
        />
      </BlurFade>

      {/* Benchmarks Callout */}
      <BlurFade delay={0.18}>
        <SectionCard
          title="Benchmarks"
          subtitle="Sector norms from Domain research"
          icon={<Scale className="h-4 w-4" />}
          empty={metrics.every((m) => !m.benchmark_value)}
          emptyMessage="No benchmark comparisons parsed at L1."
        >
          {metrics.some((m) => m.benchmark_value) && (
            <ul className="space-y-1 text-xs">
              {metrics
                .filter((m) => m.benchmark_value)
                .map((m) => (
                  <li key={m.id} className="flex items-baseline justify-between border-b border-border/40 py-1">
                    <span className="text-muted-foreground">{m.metric_name}</span>
                    <span className="text-foreground">
                      {m.value} <span className="text-muted-foreground">vs</span> {m.benchmark_value}
                      {m.alpha && <span className={m.alpha.startsWith("+") ? "text-score-strong ml-2" : "text-severity-critical ml-2"}>{m.alpha}</span>}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Performance Flags */}
      <BlurFade delay={0.2}>
        <SectionCard
          title="Performance Flags"
          subtitle="Filtered from Risk · grouped by severity"
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <FlagLane title="CRITICAL" tone="critical" flags={tCritical} />
            <FlagLane title="ELEVATED" tone="elevated" flags={tElevated} />
            <FlagLane title="MONITOR" tone="monitor" flags={tMonitor} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Performance Interrogatory subset */}
      <BlurFade delay={0.22}>
        <SectionCard
          title="Performance Interrogatory (B-series)"
          subtitle="Questions deep-linked from Interrogatory Matrix"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={trackQuestions.length === 0 && engagementCaseStudies.length === 0}
          emptyMessage="No track-record questions generated at L1."
        >
          {trackQuestions.length > 0 && (
            <ul className="space-y-1.5">
              {trackQuestions.map((q) => (
                <li key={q.id} className="text-xs text-foreground/85 flex gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{q.question_id || "—"}</span>
                  <span className="leading-relaxed">{q.question}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}
