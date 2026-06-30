import { Leaf, ShieldCheck, AlertTriangle, MinusCircle } from "lucide-react";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.1 — ESG Validation Card
 *
 * Conditional render: only when SFDR Article 8/9 OR explicit impact focus.
 * Carries its own 1.0–4.0 ESG score (separate from 1–10 dimension scoring).
 *
 * Three blocks:
 *  1. GP claims list (`gp_claims[]`)
 *  2. Process matrix (Policy / Integration / Engagement / Reporting)
 *  3. ESG score with band label
 *
 * Pre-Phase 7.4 the synthesis pipeline doesn't emit these fields yet, so
 * we accept optional props and render a labelled empty state when missing.
 */

export type EsgClaim = {
  id: string;
  claim: string;
  validation: "verified" | "partial" | "unverified" | "contradicted";
  evidence?: string | null;
};

export type EsgProcessRow = {
  pillar: "Policy" | "Integration" | "Engagement" | "Reporting";
  status: "robust" | "developing" | "absent" | "unknown";
  detail?: string | null;
};

interface EsgValidationCardProps {
  sfdrClass?: string | null;
  impactFocus?: string | null;
  esgScore?: number | null; // 1.0–4.0
  claims?: EsgClaim[];
  process?: EsgProcessRow[];
  delay?: number;
}

const VALIDATION_STYLE: Record<EsgClaim["validation"], string> = {
  verified: "border-score-strong/40 text-score-strong bg-score-strong/10",
  partial: "border-score-advance/40 text-score-advance bg-score-advance/10",
  unverified: "border-dashed border-border text-muted-foreground bg-muted/30",
  contradicted: "border-severity-critical/40 text-severity-critical bg-severity-critical/10",
};

const PROCESS_STATUS_STYLE: Record<EsgProcessRow["status"], string> = {
  robust: "border-score-strong/40 text-score-strong bg-score-strong/10",
  developing: "border-score-advance/40 text-score-advance bg-score-advance/10",
  absent: "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/10",
  unknown: "border-dashed border-border text-muted-foreground bg-muted/30",
};

const ESG_BANDS: Array<{ min: number; max: number; label: string; cls: string }> = [
  { min: 3.5, max: 4.0, label: "Leader", cls: "border-score-strong/40 text-score-strong bg-score-strong/10" },
  { min: 2.5, max: 3.49, label: "Above Average", cls: "border-score-advance/40 text-score-advance bg-score-advance/10" },
  { min: 1.5, max: 2.49, label: "Below Average", cls: "border-score-review/40 text-score-review bg-score-review/10" },
  { min: 1.0, max: 1.49, label: "Laggard", cls: "border-severity-critical/40 text-severity-critical bg-severity-critical/10" },
];

function bandFor(score: number | null | undefined) {
  if (score == null) return null;
  return ESG_BANDS.find((b) => score >= b.min && score <= b.max) ?? null;
}

export function EsgValidationCard({
  sfdrClass,
  impactFocus,
  esgScore = null,
  claims = [],
  process = [],
}: EsgValidationCardProps) {
  const subtitle = [
    sfdrClass ? `SFDR ${sfdrClass}` : null,
    impactFocus ? `Impact: ${impactFocus}` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "ESG-eligible mandate";

  const band = bandFor(esgScore);

  return (
    <SectionCard
      title="ESG Validation"
      subtitle={`${subtitle} · Separate 1.0–4.0 ESG scale`}
      icon={<Leaf className="h-4 w-4" />}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-0.5 tabular-nums">
            <span className="text-2xl font-bold text-foreground">
              {esgScore != null ? esgScore.toFixed(1) : "─"}
            </span>
            <span className="text-xs text-muted-foreground">/4.0</span>
          </div>
          {band && (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                band.cls,
              )}
            >
              {band.label}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* GP claims */}
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold mb-2">
            GP Claims
          </p>
          {claims.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">
              No GP ESG claims emitted yet (awaiting Phase 7.4 synthesis: <code className="font-mono text-[10px]">gp_claims[]</code>).
            </p>
          ) : (
            <ul className="space-y-2">
              {claims.map((c) => (
                <li key={c.id} className="flex items-start gap-3 text-xs">
                  <ClaimIcon validation={c.validation} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground font-medium leading-snug">{c.claim}</p>
                    {c.evidence && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-snug">{c.evidence}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold",
                      VALIDATION_STYLE[c.validation],
                    )}
                  >
                    {c.validation}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Process matrix */}
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold mb-2">
            Process Matrix
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(["Policy", "Integration", "Engagement", "Reporting"] as const).map((pillar) => {
              const row = process.find((p) => p.pillar === pillar);
              const status = row?.status ?? "unknown";
              return (
                <div
                  key={pillar}
                  className="rounded-md border border-border bg-muted/10 p-3"
                >
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    {pillar}
                  </p>
                  <span
                    className={cn(
                      "mt-1.5 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold",
                      PROCESS_STATUS_STYLE[status],
                    )}
                  >
                    {status}
                  </span>
                  {row?.detail && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
                      {row.detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {esgScore == null && claims.length === 0 && process.length === 0 && (
          <p className="text-[10px] italic text-muted-foreground">
            ESG payload (esg_score, gp_claims, process_matrix) lands in Phase 7.4 synthesis. Card renders
            structurally now so reviewers know what to expect.
          </p>
        )}
      </div>
    </SectionCard>
  );
}

function ClaimIcon({ validation }: { validation: EsgClaim["validation"] }) {
  const cls = "h-3.5 w-3.5 shrink-0 mt-0.5";
  switch (validation) {
    case "verified":
      return <ShieldCheck className={cn(cls, "text-score-strong")} />;
    case "partial":
      return <ShieldCheck className={cn(cls, "text-score-advance")} />;
    case "contradicted":
      return <AlertTriangle className={cn(cls, "text-severity-critical")} />;
    case "unverified":
    default:
      return <MinusCircle className={cn(cls, "text-muted-foreground")} />;
  }
}