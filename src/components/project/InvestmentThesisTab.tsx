import { Lightbulb, ListChecks, Target, MessageSquare } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { EsgValidationCard } from "@/components/project/typed/EsgValidationCard";
import { CitationRefs } from "@/components/project/typed/CitationRefs";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * PRD v2.0 §3.2 — Investment Thesis tab
 *
 * Layout:
 *  1. Score header (1–10 + tier label)
 *  2. 3–5 Takeaways
 *  3. Three-block thesis_summary: What betting on / Why now / How they win
 *  4. ESG validation card (CONDITIONAL — Phase 6.1, scaffolded)
 *  5. Sub-scores panel (Strategy Coherence 30 / Differentiation 25 / Market Timing 20 / Execution 25)
 *  6. 2–4 Diligence Questions
 *
 * Synthesis pipeline (Phase 7.4) will populate `thesis_summary`, takeaways,
 * and sub_scores. Today the tab reuses thesis_validations, market_factors,
 * and module_scores as a partial fill.
 */

interface InvestmentThesisTabProps {
  thesisValidations: Tables<"thesis_validations">[];
  marketFactors: Tables<"market_factors">[];
  competitors: Tables<"competitive_landscape">[];
  interrogatoryItems: Tables<"interrogatory_items">[];
  moduleScoresData?: any[];
  project?: Tables<"projects">;
}

const SUB_SCORES = [
  { key: "coherence", label: "Strategy Coherence", weight: 30 },
  { key: "differentiation", label: "Differentiation", weight: 25 },
  { key: "timing", label: "Market Timing", weight: 20 },
  { key: "execution", label: "Execution Capability", weight: 25 },
];

export function InvestmentThesisTab({
  thesisValidations,
  marketFactors,
  interrogatoryItems,
  moduleScoresData = [],
  project,
}: InvestmentThesisTabProps) {
  // Locate the Investment Thesis dimension score
  const thesisModule = moduleScoresData.find((m) =>
    ["thesis", "module_c", "strategy"].some(
      (a) =>
        m.module_key?.toLowerCase().includes(a) ||
        m.module_label?.toLowerCase().includes(a),
    ),
  );
  const rawScore = thesisModule?.score ?? null;
  const score10 = rawScore == null ? null : rawScore > 10 ? Math.round((rawScore / 10) * 10) / 10 : rawScore;
  const tier = getSectionTier(score10);

  // Takeaways: prefer Phase 7.4 synthesized list on module_scores; fallback
  // to thesis_validations rows so the section never goes empty mid-rollout.
  const synthesized = (thesisModule?.takeaways as Array<{ text: string; detail?: string }> | undefined) ?? [];
  const takeaways =
    synthesized.length > 0
      ? synthesized.map((t: any) => ({
          text: t.text,
          detail: t.detail ?? null,
          status: null as string | null,
          citation_ids: (t.citation_ids ?? []) as string[],
        }))
      : thesisValidations.slice(0, 5).map((tv) => ({
          text: tv.claim,
          detail: tv.validation_detail,
          status: tv.validation_status,
          citation_ids: ((tv.citation_ids as string[] | null) ?? []) as string[],
        }));

  const synthSubScores = (thesisModule?.sub_scores as Array<any> | undefined) ?? [];

  // Three-block thesis_summary — Phase 7.4 synthesis target
  const whatBetting = thesisValidations[0]?.claim || null;
  const whyNow = marketFactors[0]?.title
    ? `${marketFactors[0].title}${marketFactors[0].description ? ` — ${marketFactors[0].description}` : ""}`
    : null;
  const howWin = thesisValidations.find((tv) => tv.validation_detail)?.validation_detail || null;

  // ESG conditional render predicate (PRD §6.1)
  const sfdrClass = (project as any)?.sfdr_classification || null;
  const impactFocus = (project as any)?.impact_focus || null;
  const esgEligible = !!sfdrClass || !!impactFocus;

  // Diligence Qs scoped to thesis/strategy
  const thesisQs = interrogatoryItems
    .filter((q) =>
      (q.module || q.source_module || "").toLowerCase().match(/thesis|strateg|module_c/),
    )
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* 1. Score header */}
      <BlurFade>
        <SectionCard
          title="Investment Thesis"
          subtitle="What is the GP betting on, why now, and how do they win?"
          icon={<Lightbulb className="h-4 w-4" />}
          actions={<ScoreHeader score10={score10} tier={tier} />}
        >
          {thesisModule?.summary_assessment ? (
            <p className="text-sm leading-relaxed text-foreground/90">{thesisModule.summary_assessment}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Section summary not yet synthesized at L1 — awaiting Phase 7.4 per-section synthesis.
            </p>
          )}
        </SectionCard>
      </BlurFade>

      {/* 2. Takeaways (3–5) */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Key Takeaways"
          subtitle="3–5 institutional reads from L1 triage"
          icon={<ListChecks className="h-4 w-4" />}
          empty={takeaways.length === 0}
          emptyMessage="Takeaways not yet emitted by the synthesis pipeline."
        >
          {takeaways.length > 0 && (
            <ol className="space-y-2.5">
              {takeaways.map((t, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground font-medium leading-snug">{t.text}</p>
                    {t.detail && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-snug">{t.detail}</p>
                    )}
                    {t.citation_ids && t.citation_ids.length > 0 && (
                      <div className="mt-1.5">
                        <CitationRefs ids={t.citation_ids} sectionHint="Investment Thesis" />
                      </div>
                    )}
                  </div>
                  {t.status && <ValidationStatus status={t.status} />}
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </BlurFade>

      {/* 3. Thesis summary — three blocks */}
      <BlurFade delay={0.06}>
        <SectionCard
          title="Thesis Summary"
          subtitle="What betting on · Why now · How they win"
          icon={<Target className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThesisBlock
              label="What they're betting on"
              body={whatBetting}
              empty="Bet not yet articulated."
            />
            <ThesisBlock
              label="Why now"
              body={whyNow}
              empty="Market timing rationale not yet synthesized."
            />
            <ThesisBlock
              label="How they win"
              body={howWin}
              empty="Edge / execution path not yet articulated."
            />
          </div>
        </SectionCard>
      </BlurFade>

      {/* 4. ESG validation (CONDITIONAL — Phase 6.1) */}
      {esgEligible && (
        <BlurFade delay={0.08}>
          <EsgValidationCard
            sfdrClass={sfdrClass}
            impactFocus={impactFocus}
            esgScore={(project as any)?.esg_score ?? null}
            claims={(project as any)?.esg_claims ?? []}
            process={(project as any)?.esg_process_matrix ?? []}
          />
        </BlurFade>
      )}

      {/* 5. Sub-scores panel */}
      <BlurFade delay={0.1}>
        <SectionCard
          title="Sub-Scores"
          subtitle="4 dimensions · weights sum to 100"
          icon={<ListChecks className="h-4 w-4" />}
        >
          <SubScoresPanel sectionScore10={score10} synthesized={synthSubScores} />
        </SectionCard>
      </BlurFade>

      {/* 6. Diligence Questions (2–4) */}
      <BlurFade delay={0.12}>
        <SectionCard
          title="Diligence Questions"
          subtitle="2–4 thesis-scoped questions · L1 view"
          icon={<MessageSquare className="h-4 w-4" />}
          empty={thesisQs.length === 0}
          emptyMessage="No thesis-scoped diligence questions emitted yet."
        >
          {thesisQs.length > 0 && (
            <ul className="space-y-2">
              {thesisQs.map((q) => (
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
        <span className="text-2xl font-semibold text-foreground">{score10 != null ? score10.toFixed(1) : "─"}</span>
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", tierClass)}>
        {SCORE_TIER_LABELS[tier]}
      </span>
    </div>
  );
}

function ThesisBlock({ label, body, empty }: { label: string; body: string | null; empty: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-card p-3 min-h-[88px]">
      <p className="text-[10px] text-muted-foreground font-semibold mb-1.5">
        {label}
      </p>
      {body ? (
        <p className="text-xs text-foreground/90 leading-relaxed">{body}</p>
      ) : (
        <p className="text-xs italic text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function ValidationStatus({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s.includes("valid") || s.includes("support") || s === "match"
      ? "text-score-strong border-score-strong/30"
      : s.includes("partial") || s.includes("weak")
        ? "text-score-review border-score-review/30"
        : s.includes("contra") || s.includes("invalid") || s.includes("fail")
          ? "text-severity-critical border-severity-critical/30"
          : "text-muted-foreground border-border";
  return (
    <span className={cn("ml-auto shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function SubScoresPanel({
  sectionScore10,
  synthesized = [],
}: {
  sectionScore10: number | null;
  synthesized?: Array<{ key?: string; label?: string; score?: number; weight?: number; rationale?: string }>;
}) {
  const synthMap = new Map(synthesized.map((s) => [s.key, s]));
  return (
    <div className="space-y-2">
      {SUB_SCORES.map((s) => {
        const synth = synthMap.get(s.key);
        const score = synth?.score ?? null;
        const tier = getSectionTier(score);
        return (
          <div key={s.key} className="grid grid-cols-[1fr_60px_60px_80px] items-center gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
            <div className="min-w-0">
              <p className="text-foreground font-medium truncate">{s.label}</p>
              {synth?.rationale && (
                <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate">{synth.rationale}</p>
              )}
            </div>
            <span className="text-right tabular-nums text-muted-foreground">{s.weight}%</span>
            <span className="text-right tabular-nums text-foreground font-medium">
              {score != null ? score.toFixed(1) : "─"}
            </span>
            <span className="text-right text-[10px] text-muted-foreground">
              {SCORE_TIER_LABELS[tier]}
            </span>
          </div>
        );
      })}
      <p className="text-[10px] italic text-muted-foreground pt-2">
        Section score ({sectionScore10 != null ? sectionScore10.toFixed(1) : "—"}/10) reflects the
        weighted roll-up of the four sub-dimensions above.
      </p>
    </div>
  );
}