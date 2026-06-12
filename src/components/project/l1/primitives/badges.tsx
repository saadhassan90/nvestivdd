import { cn } from "@/lib/utils";
import type { Disposition, FlagSeverity, NorthStarAnswer, SourceTier, VerdictTier } from "@/types/renderContract";

export const NORTH_STAR_CLASS: Record<NorthStarAnswer, string> = {
  ADVANCE: "bg-score-strong/10 text-score-strong border-score-strong/40",
  CONDITIONAL: "bg-severity-elevated/10 text-severity-elevated border-severity-elevated/40",
  DECLINE: "bg-severity-critical/10 text-severity-critical border-severity-critical/40",
};

export const TIER_LABEL: Record<VerdictTier, string> = {
  advance: "Advance",
  advance_with_diligence: "Advance with diligence",
  defer: "Defer",
  decline: "Decline",
};

export function NorthStarBadge({ answer, className }: { answer: NorthStarAnswer; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        NORTH_STAR_CLASS[answer],
        className,
      )}
    >
      {answer}
    </span>
  );
}

export function TierBadge({ tier, className }: { tier: VerdictTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

export const DISPOSITION_CLASS: Record<Disposition, string> = {
  CONFIRMED: "bg-score-strong/10 text-score-strong border-score-strong/40",
  CONTRADICTED: "bg-severity-critical/10 text-severity-critical border-severity-critical/40",
  UNVERIFIABLE: "bg-muted text-muted-foreground border-border",
};

export function DispositionBadge({ d }: { d: Disposition }) {
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", DISPOSITION_CLASS[d])}>
      {d}
    </span>
  );
}

export const SEVERITY_CLASS: Record<FlagSeverity, string> = {
  CRITICAL: "bg-severity-critical/10 text-severity-critical border-severity-critical/50",
  WARNING: "bg-severity-elevated/10 text-severity-elevated border-severity-elevated/40",
};

export function FlagSeverityBadge({ s }: { s: FlagSeverity }) {
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", SEVERITY_CLASS[s])}>
      {s}
    </span>
  );
}

export const TIER_BADGE_CLASS: Record<SourceTier, string> = {
  OFFICIAL_FILING: "bg-score-strong/10 text-score-strong border-score-strong/40",
  REGULATOR_DB: "bg-score-strong/10 text-score-strong border-score-strong/40",
  COURT_RECORD: "bg-score-strong/10 text-score-strong border-score-strong/40",
  PRIMARY_PRESS: "bg-score-advance/10 text-score-advance border-score-advance/40",
  INSTITUTIONAL_DISCLOSURE: "bg-score-advance/10 text-score-advance border-score-advance/40",
  COMPANY_SELF: "bg-severity-elevated/10 text-severity-elevated border-severity-elevated/40",
  SECONDARY: "bg-muted text-muted-foreground border-border",
  SOCIAL: "bg-muted text-muted-foreground border-border",
};

export const TIER_LABEL_SHORT: Record<SourceTier, string> = {
  OFFICIAL_FILING: "Official filing",
  REGULATOR_DB: "Regulator DB",
  COURT_RECORD: "Court record",
  PRIMARY_PRESS: "Primary press",
  INSTITUTIONAL_DISCLOSURE: "Institutional disclosure",
  COMPANY_SELF: "Company self",
  SECONDARY: "Secondary",
  SOCIAL: "Social",
};

export function SourceTierBadge({ tier }: { tier: SourceTier }) {
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", TIER_BADGE_CLASS[tier])}>
      {TIER_LABEL_SHORT[tier]}
    </span>
  );
}