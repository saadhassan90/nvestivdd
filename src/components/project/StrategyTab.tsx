import { Target, PieChart, Settings, DollarSign, TrendingUp, Scale, Shield, MessageSquare } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { FieldValueGrid } from "@/components/project/primitives/FieldValueGrid";
import { FlagLane } from "@/components/project/primitives/FlagLane";
import type { Tables } from "@/integrations/supabase/types";

interface StrategyTabProps {
  thesisValidations: Tables<"thesis_validations">[];
  competitors: Tables<"competitive_landscape">[];
  marketFactors: Tables<"market_factors">[];
  fees?: Tables<"fee_structure">[];
  redFlags?: Tables<"red_flags">[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  project?: Tables<"projects">;
}

export function StrategyTab({
  thesisValidations,
  fees = [],
  redFlags = [],
  interrogatoryItems = [],
  project,
}: StrategyTabProps) {
  const strategyFlags = redFlags.filter((f) =>
    (f.module || f.source_module || "").toLowerCase().includes("strateg") ||
    (f.module || f.source_module || "").toLowerCase().includes("term"),
  );
  const sCritical = strategyFlags.filter((f) => f.severity === "critical");
  const sElevated = strategyFlags.filter((f) => f.severity === "elevated");
  const sMonitor = strategyFlags.filter((f) => f.severity === "monitor");

  const strategyQuestions = interrogatoryItems.filter((q) =>
    (q.module || q.source_module || "").toLowerCase().match(/strateg|term/),
  );

  const mgmtFee = fees.find((f) => f.component?.toLowerCase().includes("management"));
  const carryFee = fees.find((f) => f.component?.toLowerCase().includes("carry") || f.component?.toLowerCase().includes("performance"));
  const hurdleFee = fees.find((f) => f.component?.toLowerCase().includes("hurdle"));

  return (
    <div className="space-y-5">
      {/* Thesis Card */}
      <BlurFade>
        <SectionCard
          title="Investment Thesis"
          subtitle="Section 7.4 narrative"
          icon={<Target className="h-4 w-4" />}
          empty={thesisValidations.length === 0 && !project?.executive_summary_narrative}
          emptyMessage="Thesis narrative not parsed at L1."
        >
          {thesisValidations.length > 0 && (
            <ul className="space-y-2">
              {thesisValidations.map((tv) => (
                <li key={tv.id} className="text-xs">
                  <p className="text-foreground font-medium leading-relaxed">{tv.claim}</p>
                  {tv.validation_detail && (
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">{tv.validation_detail}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Portfolio Construction */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Portfolio Construction"
          subtitle="Coinvest % vs FoF % (with capital-per-sleeve)"
          icon={<PieChart className="h-4 w-4" />}
          empty={true}
          emptyMessage="Portfolio construction split not parsed at L1."
        />
      </BlurFade>

      {/* Target Company Profile */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Target Company Profile"
          subtitle="Revenue · EBITDA · segment"
          icon={<Settings className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Revenue (max)", value: null },
              { label: "EBITDA min", value: null },
              { label: "EBITDA max", value: null },
              { label: "Segment", value: project?.strategy },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Term Structure */}
      <BlurFade delay={0.08}>
        <SectionCard
          title="Term Structure"
          subtitle="Fund life · IP · recycling"
          icon={<Scale className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Fund Life", value: null },
              { label: "Investment Period", value: null },
              { label: "Recycling Implied", value: null },
              { label: "Recycling Mechanism", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Economics */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Economics"
          subtitle="Mgmt fee · carry · waterfall · hurdle · GP commit"
          icon={<DollarSign className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Mgmt Fee (during IP)", value: mgmtFee?.value ?? null, emphasis: true },
              { label: "Mgmt Fee (post IP)", value: null },
              { label: "Carry %", value: carryFee?.value ?? null, emphasis: true },
              { label: "Waterfall", value: null },
              { label: "Hurdle Rate", value: hurdleFee?.value ?? null },
              { label: "GP Commitment", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Target Returns */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Target Returns"
          subtitle="Net MOI · Net IRR · gross underlying MOIs"
          icon={<TrendingUp className="h-4 w-4" />}
        >
          <FieldValueGrid
            rows={[
              { label: "Target Net MOI", value: null, emphasis: true },
              { label: "Target Net IRR", value: null, emphasis: true },
              { label: "Basis Gross MOIs", value: null },
            ]}
          />
        </SectionCard>
      </BlurFade>

      {/* Fee Benchmark Callout */}
      <BlurFade delay={0.14}>
        <SectionCard
          title="Fee Benchmark"
          subtitle="Proposed vs market norm (Section 7.5)"
          icon={<Scale className="h-4 w-4" />}
          empty={fees.length === 0}
          emptyMessage="No fee benchmark comparisons parsed at L1."
        >
          {fees.length > 0 && (
            <ul className="space-y-1.5">
              {fees.map((f) => (
                <li key={f.id} className="flex items-baseline justify-between gap-3 text-xs border-b border-border/40 py-1">
                  <span className="text-muted-foreground">{f.component}</span>
                  <span className="font-medium text-foreground">{f.value}</span>
                  {f.assessment && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.assessment.replace(/_/g, " ")}</span>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>

      {/* Strategy Flags */}
      <BlurFade delay={0.16}>
        <SectionCard
          title="Strategy Flags"
          subtitle="Filtered from Risk · grouped by severity"
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <FlagLane title="CRITICAL" tone="critical" flags={sCritical} />
            <FlagLane title="ELEVATED" tone="elevated" flags={sElevated} />
            <FlagLane title="MONITOR" tone="monitor" flags={sMonitor} />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Strategy Interrogatory */}
      <BlurFade delay={0.18}>
        <SectionCard
          title="Strategy Interrogatory (C-series)"
          subtitle="Questions deep-linked from Interrogatory Matrix"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={strategyQuestions.length === 0}
          emptyMessage="No strategy-category questions generated at L1."
        >
          {strategyQuestions.length > 0 && (
            <ul className="space-y-1.5">
              {strategyQuestions.map((q) => (
                <li key={q.id} className="text-xs text-foreground/85 flex gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {q.question_id || "—"}
                  </span>
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
