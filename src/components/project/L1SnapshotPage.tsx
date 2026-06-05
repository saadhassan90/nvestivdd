import { useMemo, useState } from "react";
import {
  Sparkles,
  Layers,
  LineChart,
  ChevronDown,
  HelpCircle,
  Check,
  AlertTriangle,
  MessageCircleQuestion,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MethodologyModal } from "@/components/project/MethodologyModal";
import { FundFactSheet } from "@/components/project/FundFactSheet";
import { BenchmarkChip } from "@/components/project/primitives/BenchmarkChip";
import {
  BENCHMARK_LABEL_TEXT,
  compositeVerdict,
  moduleBenchmark,
  moduleVerdictLine,
} from "@/lib/verdict-labels";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/* ─────────────────────────────────────────────────────────────────────────
 * L1 Snapshot Page — v1.0 (PRD: L1 Page Redesign, June 2026)
 * Three cards: Verdict Snapshot · Findings Overview · Module Scorecard.
 * Replaces the entire L1 view (no left sidebar, no per-module tabs).
 * Renders entirely from data already present in the project tables.
 * ───────────────────────────────────────────────────────────────────────── */

type Severity = "Critical" | "Elevated";
type Rating = "Strong" | "Adequate" | "Below Avg" | "Weak" | "Conditional";
type Verdict = {
  composite: number | null;
  tier: "Strong" | "Adequate" | "Review" | "Decline";
  recommendation: string;
  recommendationTone: "good" | "warn" | "bad" | "neutral";
  confidence_pct: number | null;
  confidence_tier: "HIGH" | "MEDIUM" | "LOW";
  hard_floor: "Pass" | "Fail";
  critical_flags: number;
  risk_flags: number;
  completeness_pct: number | null;
};
type BulletTone = "critical" | "elevated" | "neutral";
type Bullet = { text: string; tone?: BulletTone };
type ModuleRow = {
  id: string;
  name: string;
  score: number | null;
  rating: Rating;
  read: string;
  positives: Bullet[];
  concerns: Bullet[];
  note?: string | null;
  module_key?: string | null;
  flagsAndQuestions?: ModuleFlagWithQuestions[];
};

type ModuleFlagWithQuestions = {
  id: string;
  title: string;
  severity: string;
  why: string | null;
  implication: string | null;
  questions: Array<{
    id: string;
    question: string;
    rationale: string | null;
    good: string | null;
    bad: string | null;
    priority: string | null;
  }>;
};

interface Props {
  project: Tables<"projects">;
  redFlags: Tables<"red_flags">[];
  moduleScores: any[];
  criticalInfoGaps: any[];
  submissionQuality: any[];
  interrogatoryItems?: Tables<"interrogatory_items">[];
  feeStructure?: Tables<"fee_structure">[];
}

export function L1SnapshotPage({
  project,
  redFlags,
  moduleScores,
  criticalInfoGaps,
  submissionQuality,
  interrogatoryItems = [],
  feeStructure = [],
}: Props) {
  const strategyTag = [project.strategy, project.asset_class, project.document_type]
    .filter(Boolean)
    .join(" · ");
  const thesis =
    (project as any).executive_summary_narrative ||
    (project as any).final_assessment_narrative ||
    "";

  const verdict = useMemo(
    () => buildVerdict(project, redFlags, submissionQuality),
    [project, redFlags, submissionQuality],
  );
  const compVerdict = useMemo(() => compositeVerdict(verdict.composite), [verdict.composite]);
  const fit = useMemo(() => extractStrings((project as any).key_strengths).slice(0, 4), [project]);
  const watch = useMemo(() => buildWatch(redFlags), [redFlags]);
  const doNext = useMemo(() => buildDoNext(project, criticalInfoGaps), [project, criticalInfoGaps]);
  const modules = useMemo(() => buildModules(moduleScores, redFlags), [moduleScores, redFlags]);
  const modulesEnriched = useMemo(
    () => attachFlagsAndQuestions(modules, redFlags, interrogatoryItems),
    [modules, redFlags, interrogatoryItems],
  );

  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  return (
    <main className="flex-1 min-w-0 bg-background overflow-y-auto">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-6 py-8 pb-16">
        {/* ─── Card 1: Verdict Snapshot ─── */}
        <BlurFade delay={0.02}>
          <Card>
            <CardHead
              icon={<Sparkles className="h-4 w-4" />}
              title="Verdict Snapshot"
              subtitle="Composite score · Recommendation · Confidence"
            />
            {strategyTag && (
              <p className="px-7 pl-[68px] pt-4 text-[11px] font-bold uppercase tracking-[0.13em] text-[hsl(var(--nvestiv-teal))]">
                {strategyTag}
              </p>
            )}
            {thesis && (
              <p className="px-7 pl-[68px] pr-7 pt-2 text-[14.5px] leading-relaxed text-muted-foreground">
                {thesis}
              </p>
            )}

            {/* 3-col verdict */}
            <div className="mx-7 mt-6 grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr] overflow-hidden rounded-xl border border-border">
              <VCell label="Composite Score" trailing={<MethodologyModal />}>
                <BigNum value={verdict.composite} denom="/100" />
                <TierPill tier={verdict.tier} />
              </VCell>
              <VCell label="Recommendation" borderLeft>
                <RecoBadge label={verdict.recommendation} tone={verdict.recommendationTone} />
                <p className="mt-3 text-[13px] font-semibold leading-snug text-foreground">
                  {compVerdict.headline}
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                  {compVerdict.detail}
                </p>
                <p className="mt-2 text-[11.5px] italic leading-snug text-muted-foreground">
                  {verdict.hard_floor === "Pass"
                    ? "Clears the hard floor."
                    : "Hard floor failed — verdict gated."}
                </p>
              </VCell>
              <VCell label="Confidence" borderLeft>
                <BigNum value={verdict.confidence_pct} denom="% complete" />
                <ConfPill tier={verdict.confidence_tier} />
                <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
                  {(project as any).confidence_reason || "Confidence rises as documents land."}
                </p>
              </VCell>
            </div>

            {/* Findings tiles */}
            <div className="grid grid-cols-2 gap-3 px-7 pb-6 pt-5 sm:grid-cols-4">
              <Tile label="Hard Floor" value={verdict.hard_floor} tone={verdict.hard_floor === "Pass" ? "good" : "bad"} />
              <Tile label="Critical Flags" value={verdict.critical_flags} tone={verdict.critical_flags === 0 ? "good" : "bad"} />
              <Tile label="Risk Flags" value={verdict.risk_flags} tone={verdict.risk_flags === 0 ? "good" : "warn"} />
              <Tile
                label="Completeness"
                value={verdict.completeness_pct != null ? `${verdict.completeness_pct}%` : "—"}
                tone={
                  verdict.completeness_pct == null
                    ? "neutral"
                    : verdict.completeness_pct >= 70
                      ? "good"
                      : verdict.completeness_pct >= 40
                        ? "warn"
                        : "bad"
                }
              />
            </div>
          </Card>
        </BlurFade>

        {/* ─── Card 1.5: Fund Fact Sheet ─── */}
        <FundFactSheet project={project} fees={feeStructure} />

        {/* ─── Card 2: Findings Overview ─── */}
        <BlurFade delay={0.08}>
          <Card>
            <CardHead
              icon={<Layers className="h-4 w-4" />}
              title="Findings Overview"
              subtitle="At-a-glance verdict signals"
            />
            <div className="grid grid-cols-1 gap-x-9 gap-y-6 px-7 pb-7 pt-5 md:grid-cols-2">
              <SignalCol label="Why it could fit" accent="bg-score-strong">
                {fit.length === 0 ? (
                  <EmptyLine text="No fit signals captured." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {fit.map((t, i) => (
                      <li key={i} className="flex gap-2.5 text-[13.5px] leading-snug">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-score-strong" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SignalCol>

              <SignalCol label="What to watch" accent="bg-severity-critical">
                {watch.length === 0 ? (
                  <EmptyLine text="No gating flags." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {watch.map((w, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                        <SevDot severity={w.severity} />
                        <span>
                          <span
                            className={cn(
                              "block text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground",
                            )}
                          >
                            {w.severity}
                          </span>
                          {w.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SignalCol>

              <SignalCol label="Do next" accent="bg-[hsl(var(--nvestiv-teal))]" full>
                {doNext.length === 0 ? (
                  <EmptyLine text="No immediate actions captured." />
                ) : (
                  <ol className="flex flex-col gap-2.5">
                    {doNext.slice(0, 3).map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13.5px] leading-snug">
                        <span className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nvestiv-teal))] text-[11.5px] font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{t}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </SignalCol>
            </div>
          </Card>
        </BlurFade>

        {/* ─── Card 3: Module Scorecard ─── */}
        <BlurFade delay={0.14}>
          <Card>
            <CardHead
              icon={<LineChart className="h-4 w-4" />}
              title="Module Scorecard"
              subtitle={`${modules.length} scored modules · 0–10 · tap a row for the full read`}
            />
            <div className="px-5 pb-4 pt-2">
              {modules.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Module scores not yet available.
                </p>
              ) : (
                modulesEnriched.map((m) => (
                  <ModuleAccordion
                    key={m.id}
                    row={m}
                    open={openId === m.id}
                    onToggle={() => setOpenId(openId === m.id ? null : m.id)}
                  />
                ))
              )}
            </div>
          </Card>
        </BlurFade>

        {/* ─── Card 4: Initial Questions ─── */}
        <BlurFade delay={0.2}>
          <Card>
            <CardHead
              icon={<MessageCircleQuestion className="h-4 w-4" />}
              title="Initial Questions"
              subtitle="Open items raised by the triage research — to put to the GP"
            />
            <InitialQuestionsList items={interrogatoryItems} />
          </Card>
        </BlurFade>

        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap justify-between gap-2 px-2 pt-2 text-[11.5px] text-muted-foreground">
          <span>
            Generated by <b className="font-semibold text-foreground/70">IRIS</b> · AI Research Agent · L1 Pre-Data-Room
          </span>
          <span>
            <b className="font-semibold text-foreground/70">Strictly Confidential</b> — Institutional Use Only
          </span>
        </div>
      </div>
    </main>
  );
}

/* ─── Layout primitives ──────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(22,33,56,0.04)]">
      {children}
    </section>
  );
}

function CardHead({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-7 pt-6">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nvestiv-teal)/0.10)] text-[hsl(var(--nvestiv-teal))]">
        {icon}
      </span>
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function VCell({
  label,
  trailing,
  borderLeft,
  children,
}: {
  label: string;
  trailing?: React.ReactNode;
  borderLeft?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-6 py-5", borderLeft && "md:border-l border-border")}>
      <div className="mb-3 flex items-center justify-between gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <span>{label}</span>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function BigNum({ value, denom }: { value: number | null; denom: string }) {
  return (
    <div className="flex items-baseline gap-1 leading-none">
      <span className="text-5xl font-extrabold tracking-tight tabular-nums text-foreground">
        {value ?? "—"}
      </span>
      <span className="text-base font-semibold text-muted-foreground">{denom}</span>
    </div>
  );
}

function RecoBadge({ label, tone }: { label: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "good"
      ? "bg-score-strong text-white"
      : tone === "warn"
        ? "bg-score-review text-white"
        : tone === "bad"
          ? "bg-severity-critical text-white"
          : "bg-muted text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[9px] px-5 py-3 text-[15px] font-extrabold uppercase tracking-wider",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function TierPill({ tier }: { tier: Verdict["tier"] }) {
  const map: Record<Verdict["tier"], string> = {
    Strong: "bg-score-strong/15 text-score-strong",
    Adequate: "bg-[hsl(var(--nvestiv-teal)/0.15)] text-[hsl(var(--nvestiv-teal))]",
    Review: "bg-score-review/15 text-score-review",
    Decline: "bg-severity-critical/15 text-severity-critical",
  };
  return (
    <span
      className={cn(
        "mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
        map[tier],
      )}
    >
      {tier}
    </span>
  );
}

function ConfPill({ tier }: { tier: Verdict["confidence_tier"] }) {
  const map: Record<Verdict["confidence_tier"], string> = {
    HIGH: "bg-score-strong/15 text-score-strong",
    MEDIUM: "bg-score-review/15 text-score-review",
    LOW: "bg-severity-elevated/15 text-severity-elevated",
  };
  return (
    <span
      className={cn(
        "mt-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
        map[tier],
      )}
    >
      {tier}
    </span>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "good" | "warn" | "bad" | "neutral";
}) {
  const cls =
    tone === "good"
      ? "text-score-strong"
      : tone === "warn"
        ? "text-severity-elevated"
        : tone === "bad"
          ? "text-severity-critical"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border px-4 py-3.5">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-[21px] font-extrabold tabular-nums tracking-tight", cls)}>
        {value}
      </p>
    </div>
  );
}

function SignalCol({
  label,
  accent,
  full,
  children,
}: {
  label: string;
  accent: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(full && "md:col-span-2")}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        <span className={cn("h-[2px] w-[18px] rounded-full", accent)} />
        {label}
      </div>
      {children}
    </div>
  );
}

function SevDot({ severity }: { severity: Severity }) {
  const cls =
    severity === "Critical"
      ? "bg-severity-critical shadow-[0_0_0_4px_hsl(var(--severity-critical)/0.18)]"
      : "bg-severity-elevated shadow-[0_0_0_4px_hsl(var(--severity-elevated)/0.18)]";
  return <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", cls)} />;
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-[13px] italic text-muted-foreground">{text}</p>;
}

function RatingChip({ rating }: { rating: Rating }) {
  const map: Record<Rating, string> = {
    Strong: "bg-score-strong/15 text-score-strong",
    Adequate: "bg-[hsl(var(--nvestiv-teal)/0.15)] text-[hsl(var(--nvestiv-teal))]",
    "Below Avg": "bg-severity-elevated/15 text-severity-elevated",
    Conditional: "bg-score-review/15 text-score-review",
    Weak: "bg-severity-critical/15 text-severity-critical",
  };
  return (
    <span
      className={cn(
        "inline-flex w-[92px] items-center justify-center rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-wide",
        map[rating],
      )}
    >
      {rating}
    </span>
  );
}

function ModuleAccordion({
  row,
  open,
  onToggle,
}: {
  row: ModuleRow;
  open: boolean;
  onToggle: () => void;
}) {
  const barColor =
    row.rating === "Strong"
      ? "bg-score-strong"
      : row.rating === "Adequate"
        ? "bg-[hsl(var(--nvestiv-teal))]"
        : row.rating === "Below Avg"
          ? "bg-severity-elevated"
          : row.rating === "Conditional"
            ? "bg-score-review"
            : "bg-severity-critical";
  const pct = row.score == null ? 0 : Math.max(0, Math.min(100, row.score * 10));
  const bench = moduleBenchmark(row.score);
  const verdictLine = moduleVerdictLine(row.score);

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[20px_180px_1fr_auto] items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors hover:bg-muted/40 md:gap-4"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
        <span className="text-[14px] font-bold text-foreground">{row.name}</span>
        <span className="hidden flex-col gap-0.5 md:flex">
          <span className="text-[13px] leading-snug text-foreground">
            {row.read || verdictLine}
          </span>
          <span className="text-[11px] italic leading-snug text-muted-foreground">
            {BENCHMARK_LABEL_TEXT[bench]} · {verdictLine}
          </span>
        </span>
        <span className="flex items-center gap-3.5">
          <span className="relative h-1.5 w-[54px] overflow-hidden rounded-full bg-muted">
            <span
              className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="w-[52px] text-right text-[15px] font-extrabold tracking-tight tabular-nums text-foreground">
            {row.score == null ? "—" : row.score.toFixed(1)}
            <span className="text-[11px] font-semibold text-muted-foreground">/10</span>
          </span>
          <BenchmarkChip score10={row.score} text={BENCHMARK_LABEL_TEXT[bench]} />
        </span>
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <DetailBody row={row} />
        </div>
      </div>
    </div>
  );
}

function DetailBody({ row }: { row: ModuleRow }) {
  const posCount = row.positives.length;
  const negCount = row.concerns.length;
  const total = posCount + negCount;
  const posPct = total === 0 ? 50 : Math.round((posCount / total) * 100);
  const negPct = 100 - posPct;

  // Implication tone keyed off rating
  const impTone: "str" | "adq" | "ba" | "cond" =
    row.rating === "Strong"
      ? "str"
      : row.rating === "Adequate"
        ? "adq"
        : row.rating === "Conditional"
          ? "cond"
          : "ba";

  const impClass: Record<typeof impTone, string> = {
    str: "bg-score-strong/12 text-score-strong",
    adq: "bg-[hsl(var(--nvestiv-teal)/0.12)] text-[hsl(var(--nvestiv-teal))]",
    ba: "bg-severity-elevated/12 text-severity-elevated",
    cond: "bg-score-review/12 text-score-review",
  };

  const implication = row.read || row.note;

  return (
    <div className="mx-2.5 mb-4 rounded-[10px] border border-border bg-muted/30 p-5">
      {total === 0 ? (
        <EmptyLine text="No detailed bullets available for this module." />
      ) : (
        <>
          {/* Tier 0 — proportion topper */}
          <div className="mb-5 flex h-1 overflow-hidden rounded-full bg-muted">
            <span className="bg-score-strong" style={{ width: `${posPct}%` }} />
            <span className="bg-severity-critical/70" style={{ width: `${negPct}%` }} />
          </div>

          {/* Tier 1 — Strengths */}
          {posCount > 0 && (
            <EvidenceGroup
              tone="pos"
              label="Strengths"
              count={posCount}
              items={row.positives}
            />
          )}

          {/* Tier 1 — Concerns */}
          {negCount > 0 && (
            <EvidenceGroup
              tone="neg"
              label="Concerns"
              count={negCount}
              items={row.concerns}
            />
          )}

          {/* Tier 2 — Implication */}
          {implication && (
            <div
              className={cn(
                "mt-5 flex flex-col gap-0.5 rounded-[10px] px-4 py-3",
                impClass[impTone],
              )}
            >
              <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] opacity-70">
                Implication
              </span>
              <span className="text-[13px] font-medium leading-snug">{implication}</span>
            </div>
          )}

          {/* Tier 3 — Sources footer */}
          {row.note && implication !== row.note && (
            <p className="mt-4 text-[11px] italic text-muted-foreground">{row.note}</p>
          )}
        </>
      )}

      {/* Flags & questions tied to this module */}
      {row.flagsAndQuestions && row.flagsAndQuestions.length > 0 && (
        <ModuleFlagsAndQuestions items={row.flagsAndQuestions} />
      )}
    </div>
  );
}

function ModuleFlagsAndQuestions({ items }: { items: ModuleFlagWithQuestions[] }) {
  return (
    <div className="mt-5 rounded-[10px] border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 text-severity-elevated" />
        Flags in this module
        <span className="ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
          {items.length}
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((f) => {
          const sev = (f.severity || "monitor").toLowerCase();
          const sevBar =
            sev === "critical"
              ? "border-l-severity-critical bg-severity-critical/5"
              : sev === "elevated"
                ? "border-l-severity-elevated bg-severity-elevated/5"
                : "border-l-muted-foreground bg-muted/30";
          return (
            <li key={f.id} className={cn("rounded-md border border-border border-l-4 p-3", sevBar)}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-foreground leading-snug">{f.title}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  {f.severity}
                </span>
              </div>
              {f.why && (
                <div className="mt-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                    Why it was raised
                  </p>
                  <p className="text-[12.5px] text-foreground/85 leading-snug">{f.why}</p>
                </div>
              )}
              {f.implication && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                    Implication
                  </p>
                  <p className="text-[12.5px] text-foreground/85 leading-snug">{f.implication}</p>
                </div>
              )}
              {f.questions.length > 0 && (
                <div className="mt-3 border-t border-border/40 pt-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    Questions to ask ({f.questions.length})
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {f.questions.map((q) => (
                      <li key={q.id} className="rounded border border-border bg-card px-2.5 py-2">
                        <p className="text-[12.5px] font-medium leading-snug text-foreground">{q.question}</p>
                        {q.rationale && (
                          <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                            <span className="text-[10px] uppercase tracking-wider font-semibold mr-1">
                              Rationale
                            </span>
                            {q.rationale}
                          </p>
                        )}
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="rounded border border-score-strong/30 bg-score-strong/5 px-2 py-1.5">
                            <p className="text-[9.5px] uppercase tracking-wider font-bold text-score-strong mb-0.5">
                              Good answer
                            </p>
                            <p className="text-[11.5px] leading-snug text-foreground/85">
                              {q.good && q.good.trim() ? q.good : <span className="italic text-muted-foreground">—</span>}
                            </p>
                          </div>
                          <div className="rounded border border-severity-critical/30 bg-severity-critical/5 px-2 py-1.5">
                            <p className="text-[9.5px] uppercase tracking-wider font-bold text-severity-critical mb-0.5">
                              Bad answer
                            </p>
                            <p className="text-[11.5px] leading-snug text-foreground/85">
                              {q.bad && q.bad.trim() ? q.bad : <span className="italic text-muted-foreground">—</span>}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EvidenceGroup({
  tone,
  label,
  count,
  items,
}: {
  tone: "pos" | "neg";
  label: string;
  count: number;
  items: Bullet[];
}) {
  const headCls = tone === "pos" ? "text-score-strong" : "text-severity-critical";
  return (
    <div className="mt-0 [&+&]:mt-[18px]">
      <div
        className={cn(
          "mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-tight",
          headCls,
        )}
      >
        {tone === "pos" ? (
          <Check className="h-[15px] w-[15px]" strokeWidth={2.5} />
        ) : (
          <AlertTriangle className="h-[15px] w-[15px]" strokeWidth={2.5} />
        )}
        <span>{label}</span>
        <span className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground">
          {count}
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((b, i) =>
          tone === "pos" ? (
            <li
              key={i}
              className="flex gap-2.5 text-[13.5px] leading-[1.55] text-foreground"
            >
              <Check
                className="mt-[3px] h-3 w-3 shrink-0 text-score-strong"
                strokeWidth={3}
              />
              <span>{b.text}</span>
            </li>
          ) : (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-foreground"
            >
              <span
                className={cn(
                  "mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full",
                  b.tone === "critical"
                    ? "bg-severity-critical"
                    : b.tone === "elevated"
                      ? "bg-severity-elevated"
                      : "bg-muted-foreground",
                )}
              />
              <span>{b.text}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

/* ─── Data adapters (derive from existing tables) ────────────────────── */

function InitialQuestionsList({
  items,
}: {
  items: Tables<"interrogatory_items">[];
}) {
  const PRIORITY_ORDER: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const sorted = [...items]
    .filter((q) => q.status !== "resolved")
    .sort((a, b) => {
      const pa = PRIORITY_ORDER[(a.priority || "").toLowerCase()] ?? 9;
      const pb = PRIORITY_ORDER[(b.priority || "").toLowerCase()] ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.order_index ?? 0) - (b.order_index ?? 0);
    });
  const visible = sorted.slice(0, 6);

  if (items.length === 0) {
    return (
      <p className="px-7 py-8 text-center text-sm italic text-muted-foreground">
        No outstanding questions yet — they appear here as findings raise them.
      </p>
    );
  }

  return (
    <div className="px-7 pb-6 pt-4">
      <ol className="flex flex-col">
        {visible.map((q, i) => (
          <li
            key={q.id}
            className="grid grid-cols-[28px_84px_1fr] items-start gap-3 border-b border-border/60 py-3.5 last:border-b-0"
          >
            <span className="mt-[2px] text-[12px] font-bold tabular-nums text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <PriorityChip priority={q.priority} />
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium leading-[1.5] text-foreground">
                {q.question}
              </p>
              {q.rationale && (
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                  {q.rationale}
                </p>
              )}
              {(q.source_module_label || q.source_module || q.module) && (
                <span className="mt-1.5 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {q.source_module_label || q.source_module || q.module}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
      {sorted.length > visible.length && (
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          +{sorted.length - visible.length} more open question
          {sorted.length - visible.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const p = (priority || "").toLowerCase();
  const map: Record<string, string> = {
    critical: "bg-severity-critical/15 text-severity-critical",
    high: "bg-severity-elevated/15 text-severity-elevated",
    medium: "bg-[hsl(var(--nvestiv-teal)/0.15)] text-[hsl(var(--nvestiv-teal))]",
    low: "bg-muted text-muted-foreground",
  };
  const cls = map[p] || "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex w-[84px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em]",
        cls,
      )}
    >
      {p || "open"}
    </span>
  );
}

function extractStrings(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((it) => {
      if (typeof it === "string") return it;
      if (!it || typeof it !== "object") return "";
      const o = it as Record<string, unknown>;
      // Prefer detail+category labels when present
      if (o.category && o.detail) return `${String(o.category)} — ${String(o.detail)}`;
      return String(o.title || o.text || o.detail || o.description || o.label || "");
    })
    .filter(Boolean);
}

function buildVerdict(
  project: Tables<"projects">,
  redFlags: Tables<"red_flags">[],
  submissionQuality: any[],
): Verdict {
  const composite = project.composite_score ?? null;
  const tier = tierFromScore(composite);
  const recRaw = ((project as any).recommendation_v2 || project.recommendation || "").toString().trim();
  const recUpper = recRaw.toUpperCase();
  const recommendation = recUpper || (tier === "Decline" ? "DECLINE" : "REVIEW");
  const recommendationTone: Verdict["recommendationTone"] =
    /ADVANCE/.test(recUpper) && !/CONDITION/.test(recUpper)
      ? "good"
      : /CONDITION/.test(recUpper)
        ? "warn"
        : /DECLINE|REJECT/.test(recUpper)
          ? "bad"
          : /DEFER|REVIEW/.test(recUpper)
            ? "warn"
            : "neutral";

  const confidence_pct =
    (project as any).completeness_pct ?? project.completeness_score ?? null;
  const confidence_tier: Verdict["confidence_tier"] = (() => {
    const stored = ((project as any).confidence_tier || "").toString().toUpperCase();
    if (stored === "HIGH" || stored === "MEDIUM" || stored === "LOW") return stored as any;
    if (confidence_pct == null) return "LOW";
    return confidence_pct >= 70 ? "HIGH" : confidence_pct >= 40 ? "MEDIUM" : "LOW";
  })();

  const hardFloorTriggered = submissionQuality.some(
    (sq: any) =>
      (sq.severity === "hard_floor" || sq.category?.includes?.("hard_floor")) &&
      (sq.status === "fail" || sq.status === "flagged"),
  );
  const critical_flags = redFlags.filter((f) => (f.severity || "").toLowerCase() === "critical").length;
  const risk_flags = redFlags.filter((f) => {
    const s = (f.severity || "").toLowerCase();
    return s === "elevated" || s === "monitor";
  }).length;

  return {
    composite,
    tier,
    recommendation,
    recommendationTone,
    confidence_pct,
    confidence_tier,
    hard_floor: hardFloorTriggered ? "Fail" : "Pass",
    critical_flags,
    risk_flags,
    completeness_pct: confidence_pct,
  };
}

function tierFromScore(score: number | null): Verdict["tier"] {
  if (score == null) return "Review";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Adequate";
  if (score >= 40) return "Review";
  return "Decline";
}

function buildWatch(redFlags: Tables<"red_flags">[]): { severity: Severity; text: string }[] {
  return redFlags
    .filter((f) => {
      const s = (f.severity || "").toLowerCase();
      return s === "critical" || s === "elevated";
    })
    .sort((a, b) => {
      const order = { critical: 0, elevated: 1 } as Record<string, number>;
      return (order[(a.severity || "").toLowerCase()] ?? 9) -
        (order[(b.severity || "").toLowerCase()] ?? 9);
    })
    .slice(0, 5)
    .map((f) => ({
      severity: ((f.severity || "").toLowerCase() === "critical" ? "Critical" : "Elevated") as Severity,
      text: f.title || f.issue || f.description || "Flagged item",
    }));
}

function buildDoNext(project: Tables<"projects">, gaps: any[]): string[] {
  const conditions = extractStrings((project as any).conditions_for_advancement);
  if (conditions.length) return conditions.slice(0, 3);
  return gaps
    .slice(0, 3)
    .map((g) => g.gap_title || g.gap_description)
    .filter(Boolean);
}

function buildModules(
  moduleScores: any[],
  redFlags: Tables<"red_flags">[],
): ModuleRow[] {
  if (!Array.isArray(moduleScores) || moduleScores.length === 0) return [];
  return moduleScores.map((m) => {
    const raw = m.score ?? null;
    const score10 = raw == null ? null : raw > 10 ? Math.round((raw / 10) * 10) / 10 : raw;
    const rating = ratingFor(score10, m.tier_label);
    // Positives / concerns: prefer takeaways jsonb if shaped that way
    const t = m.takeaways;
    let positives: Bullet[] = [];
    let concerns: Bullet[] = [];
    if (t && typeof t === "object" && !Array.isArray(t)) {
      positives = toBullets((t as any).positives || (t as any).strengths);
      concerns = toBullets((t as any).concerns || (t as any).risks);
    } else if (Array.isArray(t)) {
      // Heuristic: split by tone field if present
      for (const item of t) {
        const text = typeof item === "string" ? item : item?.text || item?.title || "";
        if (!text) continue;
        const tone = (item?.tone || item?.type || "").toString().toLowerCase();
        if (tone === "positive" || tone === "strength") positives.push({ text });
        else if (tone === "negative" || tone === "concern" || tone === "risk") concerns.push({ text });
        else positives.push({ text });
      }
    }
    // Fallback: pull module-scoped concerns from red_flags
    if (concerns.length === 0) {
      concerns = redFlags
        .filter((f) => (f.module || f.source_module) === m.module_key)
        .slice(0, 3)
        .map((f) => {
          const sev = (f.severity || "").toLowerCase();
          const tone: BulletTone =
            sev === "critical" ? "critical" : sev === "elevated" ? "elevated" : "neutral";
          return {
            text: f.title || f.issue || f.description || "Flagged item",
            tone,
          };
        });
    }
    // Fallback: derive a positive from summary_assessment if no positives
    if (positives.length === 0 && m.summary_assessment) {
      const firstSentence = String(m.summary_assessment).split(/(?<=[.!?])\s+/)[0];
      if (firstSentence) positives = [{ text: firstSentence }];
    }
    const read = shortRead(m.summary_assessment);
    return {
      id: m.id || m.module_key,
      name: m.module_label || m.module_key,
      score: score10,
      rating,
      read,
      positives,
      concerns,
      note: m.confidence_rationale || null,
      module_key: m.module_key || null,
    };
  });
}

function attachFlagsAndQuestions(
  rows: ModuleRow[],
  redFlags: Tables<"red_flags">[],
  questions: Tables<"interrogatory_items">[],
): ModuleRow[] {
  return rows.map((row) => {
    const keyTokens = [row.module_key, row.name]
      .filter(Boolean)
      .map((k) => String(k).toLowerCase());
    const matches = (val: string | null | undefined) => {
      if (!val) return false;
      const v = val.toLowerCase();
      return keyTokens.some((k) => v.includes(k) || k.includes(v));
    };
    const flags = redFlags.filter(
      (f) => matches(f.module) || matches(f.source_module),
    );
    const flagsAndQuestions: ModuleFlagWithQuestions[] = flags.map((f) => {
      const linked = questions.filter((q) => {
        const ids = (q.related_red_flag_ids as string[] | null) || [];
        return ids.includes(f.id);
      });
      return {
        id: f.id,
        title: f.title,
        severity: f.severity,
        why: f.issue || f.description || null,
        implication: f.implication || null,
        questions: linked.map((q) => ({
          id: q.id,
          question: q.question,
          rationale: q.rationale ?? null,
          good: (q as any).good_answer_direction ?? null,
          bad: (q as any).bad_answer_direction ?? null,
          priority: q.priority ?? null,
        })),
      };
    });
    return { ...row, flagsAndQuestions };
  });
}

function toBullets(v: unknown): Bullet[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => (typeof it === "string" ? { text: it } : { text: String((it as any)?.text || (it as any)?.title || "") }))
    .filter((b) => b.text);
}

function ratingFor(score: number | null, tierLabel?: string | null): Rating {
  const t = (tierLabel || "").toLowerCase();
  if (t.includes("conditional")) return "Conditional";
  if (score == null) return "Below Avg";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Adequate";
  if (score >= 4) return "Below Avg";
  return "Weak";
}

function shortRead(s?: string | null): string {
  if (!s) return "";
  const trimmed = String(s).trim();
  if (trimmed.length <= 120) return trimmed;
  return trimmed.slice(0, 117).replace(/[\s.,;:]+$/, "") + "…";
}

/* ─── Unused but kept for tree-shake friendliness ──────────────────── */
export const _l1HelpIcon = HelpCircle;