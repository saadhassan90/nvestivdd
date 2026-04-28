/**
 * L1 PRD v2.0 — six-tier composite score scheme (1–100):
 *   Exceptional       90–100
 *   Strong            75–89
 *   Adequate          60–74
 *   Below Average     40–59
 *   Concerning         1–39
 *   Insufficient Data  null / 0
 */
export type ScoreTier =
  | 'exceptional'
  | 'strong'
  | 'adequate'
  | 'below_average'
  | 'concerning'
  | 'insufficient_data';

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  exceptional: 'Exceptional',
  strong: 'Strong',
  adequate: 'Adequate',
  below_average: 'Below Average',
  concerning: 'Concerning',
  insufficient_data: 'Insufficient Data',
};

export function getScoreTier(score: number | null | undefined): ScoreTier {
  if (score == null || score <= 0) return 'insufficient_data';
  if (score >= 90) return 'exceptional';
  if (score >= 75) return 'strong';
  if (score >= 60) return 'adequate';
  if (score >= 40) return 'below_average';
  return 'concerning';
}

/** Section-level scores are 1–10. */
export function getSectionTier(score: number | null | undefined): ScoreTier {
  if (score == null || score <= 0) return 'insufficient_data';
  if (score >= 9) return 'exceptional';
  if (score >= 7.5) return 'strong';
  if (score >= 6) return 'adequate';
  if (score >= 4) return 'below_average';
  return 'concerning';
}

/** Returns a Tailwind text-* class for a tier. */
export function getTierTextClass(tier: ScoreTier): string {
  switch (tier) {
    case 'exceptional': return 'text-score-strong';
    case 'strong': return 'text-score-strong';
    case 'adequate': return 'text-score-advance';
    case 'below_average': return 'text-score-review';
    case 'concerning': return 'text-severity-critical';
    case 'insufficient_data': return 'text-muted-foreground';
  }
}

/** Returns the border color class for a tier (used by ScoreBadge). */
export function getTierBorderClass(tier: ScoreTier): string {
  switch (tier) {
    case 'exceptional': return 'border-score-strong';
    case 'strong': return 'border-score-strong';
    case 'adequate': return 'border-score-advance';
    case 'below_average': return 'border-score-review';
    case 'concerning': return 'border-severity-critical';
    case 'insufficient_data': return 'border-border';
  }
}

/**
 * @deprecated kept as a thin shim for legacy callers; returns the tier text class.
 */
export function getScoreColor(tier: string | null): string {
  return getTierTextClass((tier as ScoreTier) ?? 'insufficient_data').replace('text-', '');
}

export function getRecommendationLabel(rec: string | null): string {
  if (!rec) return 'N/A';
  const r = rec.toLowerCase();
  if (r.includes('decline')) return 'DECLINE';
  if (r.includes('conditional')) return 'CONDITIONAL ADVANCE';
  if (r.includes('defer') || r.includes('review') || r.includes('pass')) return 'DEFER';
  if (r.includes('advance') || r.includes('pursue') || r.includes('meet')) return 'ADVANCE';
  return rec.toUpperCase();
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'severity-critical';
    case 'elevated': return 'severity-elevated';
    case 'monitor': return 'severity-monitor';
    default: return 'muted-foreground';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'severity-critical';
    case 'high': return 'severity-elevated';
    case 'medium': return 'score-strong';
    case 'low': return 'severity-monitor';
    default: return 'muted-foreground';
  }
}

export function formatRelativeTime(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}
