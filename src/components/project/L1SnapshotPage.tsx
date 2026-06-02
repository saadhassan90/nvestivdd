import { useMemo, useState } from "react";
import { Sparkles, Layers, LineChart, ChevronDown, HelpCircle } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MethodologyModal } from "@/components/project/MethodologyModal";
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
type Bullet = { text: string };
type ModuleRow = {
  id: string;
  name: string;
  score: number | null;
  rating: Rating;
  read: string;
  positives: Bullet[];
  concerns: Bullet[];
  note?: string | null;
};

interface Props {
  project: Tables<"projects">;
  redFlags: Tables<"red_flags">[];
  moduleScores: any[];
  criticalInfoGaps: any[];
  submissionQuality: any[];
}

export function L1SnapshotPage({
  project,
  redFlags,
  moduleScores,
  criticalInfoGaps,
  submissionQuality,
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
  const fit = useMemo(() => extractStrings((project as any).key_strengths).slice(0, 4), [project]);
  const watch = useMemo(() => buildWatch(redFlags), [redFlags]);
  const doNext = useMemo(() => buildDoNext(project, criticalInfoGaps), [project, criticalInfoGaps]);
  const modules = useMemo(() => buildModules(moduleScores, redFlags), [moduleScores, redFlags]);

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
                <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
                  {verdict.hard_floor === "Pass"
                    ? "Clears the hard floor; proceed per recommendation."
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
                modules.map((m) => (
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

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[180px_1fr_auto] items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors hover:bg-muted/40 md:gap-4"
      >
        <span className="text-[14px] font-bold text-foreground">{row.name}</span>
        <span className="hidden text-[13px] leading-snug text-muted-foreground md:block">
          {row.read || "—"}
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
          <RatingChip rating={row.rating} />
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0">
          <div className="mb-4 flex flex-col gap-4 px-3 pb-2 pt-1">
            {row.positives.length > 0 && (
              <DetailCol heading="Positive" tone="good" items={row.positives} />
            )}
            {row.concerns.length > 0 && (
              <DetailCol heading="Concerns" tone="bad" items={row.concerns} />
            )}
            {!row.positives.length && !row.concerns.length && (
              <EmptyLine text="No detailed bullets available for this module." />
            )}
            {row.note && (
              <p className="border-t border-dashed border-border pt-3 text-[11.5px] italic text-muted-foreground">
                {row.note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCol({
  heading,
  tone,
  items,
}: {
  heading: string;
  tone: "good" | "bad";
  items: Bullet[];
}) {
  const headCls = tone === "good" ? "text-score-strong" : "text-severity-critical";
  const dotCls = tone === "good" ? "bg-score-strong" : "bg-severity-critical opacity-70";
  const swCls = tone === "good" ? "bg-score-strong" : "bg-severity-critical";
  return (
    <div>
      <h4
        className={cn(
          "mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.11em]",
          headCls,
        )}
      >
        <span className={cn("h-2 w-2 rounded-sm", swCls)} />
        {heading}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground">
            <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dotCls)} />
            <span>{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Data adapters (derive from existing tables) ────────────────────── */

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
        .map((f) => ({ text: f.title || f.issue || f.description || "Flagged item" }));
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
    };
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