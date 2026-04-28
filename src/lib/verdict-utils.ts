/**
 * L1 PRD v2.0 verdict vocabulary (4 tiers):
 *   Advance              — composite >= 75 (no Hard Floor)
 *   Conditional Advance  — composite 60–74
 *   Defer                — composite 40–59  OR  Completeness < 30%
 *   Decline              — any Hard Floor triggered  OR  composite < 40
 */
export type Verdict =
  | "advance"
  | "conditional_advance"
  | "defer"
  | "decline"
  | "pending"
  | "failed";

export type VerdictLabel =
  | "Advance"
  | "Conditional Advance"
  | "Defer"
  | "Decline";

export const VERDICT_LABELS: Record<Exclude<Verdict, "pending" | "failed">, VerdictLabel> = {
  advance: "Advance",
  conditional_advance: "Conditional Advance",
  defer: "Defer",
  decline: "Decline",
};

/**
 * Compute the canonical verdict for a project. Pure function — single source of truth.
 * Inputs:
 *  - score: composite score 0–100
 *  - status: project lifecycle status
 *  - hardFloorTriggered: true if any active (non-overridden) Hard Floor is fired
 *  - completenessPct: 0–100; <30 forces auto-Defer per PRD §6.5
 */
export function getVerdict(
  score: number | null,
  status: string,
  opts: { hardFloorTriggered?: boolean; completenessPct?: number | null } = {},
): Verdict {
  if (status === "failed") return "failed";
  if (
    score == null ||
    ["pending", "uploading", "processing", "analyzing", "extracting"].includes(status)
  ) {
    return "pending";
  }
  if (opts.hardFloorTriggered) return "decline";
  if (opts.completenessPct != null && opts.completenessPct < 30) return "defer";
  if (score >= 75) return "advance";
  if (score >= 60) return "conditional_advance";
  if (score >= 40) return "defer";
  return "decline";
}

export function getVerdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "advance": return "Advance";
    case "conditional_advance": return "Conditional Advance";
    case "defer": return "Defer";
    case "decline": return "Decline";
    case "pending": return "Pending";
    case "failed": return "—";
  }
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "advance": return "text-score-strong";              // green
    case "conditional_advance": return "text-severity-monitor"; // blue
    case "defer": return "text-score-review";                // amber
    case "decline": return "text-severity-critical";         // red
    case "pending": return "text-muted-foreground";
    case "failed": return "text-muted-foreground";
  }
}

/**
 * Map a stored `projects.recommendation_v2` text value (or any free-text legacy
 * value) to the canonical `Verdict` discriminator. Falls back to score-derived.
 */
export function normalizeRecommendation(
  rec: string | null | undefined,
): Verdict | null {
  if (!rec) return null;
  const r = rec.toLowerCase();
  if (r.includes("decline")) return "decline";
  if (r.includes("conditional")) return "conditional_advance";
  if (r.includes("defer") || r.includes("review") || r.includes("pass")) return "defer";
  if (r.includes("advance") || r.includes("pursue") || r.includes("meet")) return "advance";
  return null;
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "pending": return "Preparing";
    case "uploading": return "Preparing";
    case "processing": return "Researching";
    case "analyzing": return "Researching";
    case "extracting": return "Scoring";
    case "complete": return "Complete";
    case "failed": return "Failed";
    default: return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "complete": return "text-score-strong";
    case "failed": return "text-severity-critical";
    case "pending":
    case "uploading": return "text-score-review";
    case "processing":
    case "analyzing": return "text-severity-monitor";
    case "extracting": return "text-score-advance";
    default: return "text-muted-foreground";
  }
}

export function formatSubmittedDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
