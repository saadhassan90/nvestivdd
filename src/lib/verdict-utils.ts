/**
 * Verdict logic per PRD:
 * - Meet (Proceed to meeting): score >= 65
 * - Conditional (Proceed with caution): score 50-64
 * - No Meet (Hard floor triggered): score < 50
 */
export type Verdict = "proceed" | "conditional" | "hard_floor" | "pending" | "failed";

export function getVerdict(score: number | null, status: string): Verdict {
  if (status === "failed") return "failed";
  if (!score || ["pending", "uploading", "processing", "analyzing", "extracting"].includes(status)) return "pending";
  if (score >= 65) return "proceed";
  if (score >= 50) return "conditional";
  return "hard_floor";
}

export function getVerdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "proceed": return "Proceed to meeting";
    case "conditional": return "Proceed with caution";
    case "hard_floor": return "Hard floor triggered";
    case "pending": return "Pending";
    case "failed": return "—";
  }
}

export function getVerdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "proceed": return "text-score-strong";
    case "conditional": return "text-score-review";
    case "hard_floor": return "text-severity-critical";
    case "pending": return "text-muted-foreground";
    case "failed": return "text-muted-foreground";
  }
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
