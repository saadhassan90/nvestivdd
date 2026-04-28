import { TrendingUp, ListChecks, BarChart3, MessageSquare, Sprout, Table } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §3.5 — Track Record tab (renamed from "Performance").
 *
 * Two layout variants:
 *  • RICH      — has performance_metrics → render full layout
 *  • FIRST_TIME_FUND — no performance_metrics → render Insufficient Data
 *                     panel + cross-ref to Team. Excluded from composite (handled by Phase 7.3).
 *
 * Rich layout:
 *  1. Score header (1–10 + tier)
 *  2. market_context_strip (vintage_performance) — Phase 6.5 scaffold
 *  3. Headline metrics strip
 *  4. Extended track_record_table (as_of_date, pic, gross_irr_pct, gross_moic, max_sub_line_duration_days)
 *  5. Sub-scores (Realized 30 / Quality of Marks 20 / Sub-Line Distortion 15 / Vintage Comparability 20 / Attribution 15)
 *  6. Diligence Questions (2–4)
 */

interface TrackRecordTabProps {
  metrics: Tables<"performance_metrics">[];
  fees: Tables<"fee_structure">[];
  engagementCaseStudies: Tables<"engagement_case_studies">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  moduleScoresData?: any[];
  project?: Tables<"projects">;
}

const SUB_SCORES = [
  { key: "realized", label: "Realized Performance", weight: 30 },
  { key: "marks_quality", label: "Quality of Marks", weight: 20 },
  { key: "subline", label: "Sub-Line Distortion", weight: 15 },
  { key: "vintage", label: "Vintage Comparability", weight: 20 },
  { key: "attribution", label: "Attribution Clarity", weight: 15 },
];

function findMetric(metrics: Tables<"performance_metrics">[], pattern: RegExp) {
  return metrics.find((m) => pattern.test(m.metric_name));
}

export function TrackRecordTab({
  metrics,
  engagementCaseStudies,
  interrogatoryItems = [],
  moduleScoresData = [],
  project,
}: TrackRecordTabProps) {
  const trackModule = moduleScoresData.find((m) =>
    ["track", "performance", "module_a", "financial"].some(
      (a) =>
        m.module_key?.toLowerCase().includes(a) ||
        m.module_label?.toLowerCase().includes(a),
    ),
  );
  const rawScore = trackModule?.score ?? null;
  const score10Raw = rawScore == null ? null : rawScore > 10 ? Math.round((rawScore / 10) * 10) / 10 : rawScore;

  // First-time fund predicate — no realized metrics + no engagement case studies
  const isFirstTimeFund =
    metrics.length === 0 && engagementCaseStudies.length === 0;

  // First-time funds force Insufficient Data per PRD §3.5
  const score10 = isFirstTimeFund ? null : score10Raw;
  const tier = getSectionTier(score10);

  const trackQs = interrogatoryItems
    .filter((q) =>
      (q.module || q.source_module || "").toLowerCase().match(/track|performance|financial|module_a/),
    )
    .slice(0, 4);

  if (isFirstTimeFund) {
    return <FirstTimeFundVariant project={project} trackQs={trackQs} />;
  }

  const netMoi = findMetric(metrics, /net.*moi|net.*tvpi/i);
  const netIrr = findMetric(metrics, /net.*irr/i);
  const grossMoi = findMetric(metrics, /gross.*moi|gross.*tvpi/i);
  const grossIrr = findMetric(metrics, /gross.*irr/i);
  const dpi = findMetric(metrics, /\bdpi\b/i);

  return (
    <div className="space-y-5">
      {/* 1. Score header */}
      <BlurFade>
        <SectionCard
          title="Track Record"
          subtitle="Realized performance · marks quality · sub-line distortion · vintage comparability · attribution"
          icon={<TrendingUp className="h-4 w-4" />}
          actions={<ScoreHeader score10={score10} tier={tier} />}
        >
          {trackModule?.summary_assessment ? (
            <p className="text-sm leading-relaxed text-foreground/90">{trackModule.summary_assessment}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Section summary not yet synthesized at L1 — awaiting Phase 7.4 per-section synthesis.
            </p>
          )}
        </SectionCard>
      </BlurFade>

      {/* 2. market_context_strip — vintage_performance (Phase 6.5 scaffold) */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Vintage Performance Context"
          subtitle={`Market context strip${project?.vintage ? ` · vintage ${project.vintage}` : ""} · Never references the specific fund`}
          icon={<BarChart3 className="h-4 w-4" />}
        >
          <VintagePerformanceScaffold vintage={project?.vintage || null} />
        </SectionCard>
      </BlurFade>

      {/* 3. Headline metrics strip */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Headline Metrics"
          subtitle="Realized · simple-average track record"
          icon={<TrendingUp className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiTile label="Net MOI" value={netMoi?.value ?? null} />
            <KpiTile label="Net IRR" value={netIrr?.value ?? null} />
            <KpiTile label="Gross MOI" value={grossMoi?.value ?? null} />
            <KpiTile label="Gross IRR" value={grossIrr?.value ?? null} />
            <KpiTile label="DPI" value={dpi?.value ?? null} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* 4. Extended track_record_table */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Track Record Table"
          subtitle="As of · PIC · gross IRR · gross MOIC · max sub-line duration"
          icon={<Table className="h-4 w-4" />}
          empty={metrics.length === 0}
          emptyMessage="No realized fund-level metrics emitted at L1."
        >
          {metrics.length > 0 && <TrackRecordTable metrics={metrics} />}
        </SectionCard>
      </BlurFade>

      {/* 5. Sub-scores */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Sub-Scores"
          subtitle="5 dimensions · weights sum to 100"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <SubScoresPanel sectionScore10={score10} />
        </SectionCard>
      </BlurFade>

      {/* 6. Diligence Questions */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Diligence Questions"
          subtitle="2–4 track-record-scoped questions · L1 view"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={trackQs.length === 0}
          emptyMessage="No track-record-scoped diligence questions emitted yet."
        >
          {trackQs.length > 0 && (
            <ul className="space-y-2">
              {trackQs.map((q) => (
                <li key={q.id} className="text-xs border-l-2 border-border pl-3">
                  <p className="text-foreground font-medium leading-snug">{q.question}</p>
                  {q.rationale && (
                    <p className="text-[11px] text-muted-foreground italic mt-1 leading-snug">{q.rationale}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}

/* ─── First-time fund variant ───────────────────────────────────────── */

function FirstTimeFundVariant({
  project,
  trackQs,
}: {
  project?: Tables<"projects">;
  trackQs: Tables<"interrogatory_items">[];
}) {
  return (
    <div className="space-y-5">
      <BlurFade>
        <SectionCard
          title="Track Record"
          subtitle={`First-time fund${project?.fund_name ? ` — ${project.fund_name}` : ""} · Excluded from composite (renormalized in Phase 7.3)`}
          icon={<Sprout className="h-4 w-4" />}
          actions={<ScoreHeader score10={null} tier="insufficient_data" />}
        >
          <div className="space-y-3">
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground mb-1">Insufficient Data — First-Time Fund</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No realized fund-level performance is available because this is a first-time fund (or
                first-time strategy). Per PRD v2.0 §3.5 + §7.3, this dimension is marked
                <span className="font-semibold text-foreground"> Insufficient Data</span> and{" "}
                <span className="font-semibold text-foreground">excluded from composite renormalization</span> rather
                than penalized as 0/10.
              </p>
            </div>

            {/* Cross-reference to Team & Manager */}
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                Cross-reference
              </p>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Diligence weight shifts to{" "}
                <a href="?tab=team" className="font-semibold text-foreground underline underline-offset-2 decoration-dotted">
                  Team & Manager
                </a>{" "}
                — examine prior-firm pedigree, attribution at prior funds, and key-person continuity.
              </p>
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Diligence Qs still shown */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Diligence Questions"
          subtitle="First-time fund · prior-firm attribution focus"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={trackQs.length === 0}
          emptyMessage="No first-time-fund diligence questions emitted yet."
        >
          {trackQs.length > 0 && (
            <ul className="space-y-2">
              {trackQs.map((q) => (
                <li key={q.id} className="text-xs border-l-2 border-border pl-3">
                  <p className="text-foreground font-medium leading-snug">{q.question}</p>
                  {q.rationale && (
                    <p className="text-[11px] text-muted-foreground italic mt-1 leading-snug">{q.rationale}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────── */

function ScoreHeader({ score10, tier }: { score10: number | null; tier: ScoreTier }) {
  const tierClass = (() => {
    switch (tier) {
      case "exceptional":
      case "strong": return "border-score-strong/40 text-score-strong bg-score-strong/10";
      case "adequate": return "border-score-advance/40 text-score-advance bg-score-advance/10";
      case "below_average": return "border-score-review/40 text-score-review bg-score-review/10";
      case "concerning": return "border-severity-critical/40 text-severity-critical bg-severity-critical/10";
      case "insufficient_data": return "border-dashed border-border text-muted-foreground bg-muted/30";
    }
  })();
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span className="text-2xl font-bold text-foreground">{score10 != null ? score10.toFixed(1) : "─"}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", tierClass)}>
        {SCORE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}

function VintagePerformanceScaffold({ vintage }: { vintage: string | null }) {
  const cards = [
    { label: "Vintage Net IRR (median)", note: "peer median" },
    { label: "Vintage Net IRR (top quartile)", note: "Q1 cutoff" },
    { label: "Vintage Net TVPI (median)", note: "peer median" },
    { label: "Vintage DPI (median)", note: "peer median" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-md border border-dashed border-border bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {c.label}
            </p>
            <p className="text-base font-bold text-muted-foreground tabular-nums mt-1">─</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{c.note}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] italic text-muted-foreground">
        Vintage benchmarks load from the static benchmark DB (Phase 7.2) keyed by vintage{" "}
        <code className="font-mono text-[10px] text-foreground/70">{vintage || "─"}</code>.
        Strip is omitted entirely if no benchmark match.
      </p>
    </div>
  );
}

function TrackRecordTable({ metrics }: { metrics: Tables<"performance_metrics">[] }) {
  // Group rows by fund_name so each fund vintage is its own row.
  const funds = Array.from(new Set(metrics.map((m) => m.fund_name))).filter(Boolean);

  const cell = (fund: string, pattern: RegExp) =>
    metrics.find((m) => m.fund_name === fund && pattern.test(m.metric_name))?.value ?? "─";

  const cellAsOf = (fund: string) =>
    metrics.find((m) => m.fund_name === fund && m.as_of_date)?.as_of_date ?? "─";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-semibold py-2 pr-3">Fund</th>
            <th className="text-right font-semibold py-2 pr-3">As Of</th>
            <th className="text-right font-semibold py-2 pr-3">PIC</th>
            <th className="text-right font-semibold py-2 pr-3">Gross IRR</th>
            <th className="text-right font-semibold py-2 pr-3">Gross MOIC</th>
            <th className="text-right font-semibold py-2 pr-3">Net IRR</th>
            <th className="text-right font-semibold py-2 pr-3">Net TVPI</th>
            <th className="text-right font-semibold py-2">Sub-Line Max (d)</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund) => (
            <tr key={fund} className="border-b border-border/30 last:border-0">
              <td className="py-2 pr-3 text-foreground font-medium">{fund}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{cellAsOf(fund)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-foreground">{cell(fund, /\bpic\b|paid.in.capital/i)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-foreground">{cell(fund, /gross.*irr/i)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-foreground">{cell(fund, /gross.*moic|gross.*moi/i)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-foreground">{cell(fund, /net.*irr/i)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-foreground">{cell(fund, /net.*tvpi|net.*moi/i)}</td>
              <td className="py-2 text-right tabular-nums text-foreground">{cell(fund, /sub.?line|subscription.?line/i)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] italic text-muted-foreground pt-2">
        Extended fields (PIC, max sub-line duration days) populate as the Phase 7.4 synthesis pipeline emits them.
        Empty cells render as ─ rather than blanks.
      </p>
    </div>
  );
}

function SubScoresPanel({ sectionScore10 }: { sectionScore10: number | null }) {
  return (
    <div className="space-y-2">
      {SUB_SCORES.map((s) => (
        <div key={s.key} className="grid grid-cols-[1fr_60px_60px_80px] items-center gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
          <span className="text-foreground font-medium truncate">{s.label}</span>
          <span className="text-right tabular-nums text-muted-foreground">{s.weight}%</span>
          <span className="text-right tabular-nums text-muted-foreground">─</span>
          <span className="text-right text-[10px] uppercase tracking-wider text-muted-foreground">
            {SCORE_TIER_LABELS["insufficient_data"]}
          </span>
        </div>
      ))}
      <p className="text-[10px] italic text-muted-foreground pt-2">
        Sub-score breakdown lands in Phase 4.3 (storage) + Phase 7.4 (synthesis).
        Section score above ({sectionScore10 != null ? sectionScore10.toFixed(1) : "—"}/10) reflects the rolled-up dimension.
      </p>
    </div>
  );
}