export function getScoreTier(score: number | null): 'strong_advance' | 'advance' | 'review' | 'decline' {
  if (!score) return 'decline';
  if (score >= 85) return 'strong_advance';
  if (score >= 70) return 'advance';
  if (score >= 50) return 'review';
  return 'decline';
}

export function getScoreColor(tier: string | null): string {
  switch (tier) {
    case 'strong_advance': return 'score-strong';
    case 'advance': return 'score-advance';
    case 'review': return 'score-review';
    case 'decline': return 'score-decline';
    default: return 'muted-foreground';
  }
}

export function getRecommendationLabel(rec: string | null): string {
  switch (rec) {
    case 'Strong Advance': return 'STRONG ADVANCE';
    case 'Advance with Diligence': return 'ADVANCE';
    case 'Review Required': return 'REVIEW';
    case 'Decline': return 'DECLINE';
    default: return rec?.toUpperCase() || 'N/A';
  }
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
