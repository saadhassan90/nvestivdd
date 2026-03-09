import { useState } from "react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

interface InterrogatoryTabProps {
  items: Tables<"interrogatory_items">[];
  fundName: string;
}

const PRIORITY_TIERS = [
  { key: "all", label: "All Questions" },
  { key: "critical", label: "Tier 1: Critical" },
  { key: "high", label: "Tier 2: Important" },
  { key: "medium", label: "Tier 3: Nice-to-Have" },
  { key: "low", label: "Tier 4: Contextual" },
];

const TIER_LABELS: Record<string, { title: string; desc: string }> = {
  critical: { title: "Priority Tier 1 — Critical Before Investment Decision", desc: "These questions must be answered satisfactorily before advancing." },
  high: { title: "Priority Tier 2 — Important for Operational Confidence", desc: "Important for building operational and strategic confidence." },
  medium: { title: "Priority Tier 3 — Nice-to-Have", desc: "Can be addressed in data room if time-constrained at GP meeting." },
  low: { title: "Priority Tier 4 — Contextual", desc: "Supplementary context for deeper understanding." },
};

const BORDER_COLORS: Record<string, string> = {
  critical: "border-l-severity-critical",
  high: "border-l-severity-elevated",
  medium: "border-l-score-advance",
  low: "border-l-severity-monitor",
};

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-elevated",
  medium: "bg-score-advance",
  low: "bg-severity-monitor",
};

export function InterrogatoryTab({ items, fundName }: InterrogatoryTabProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const grouped = {
    critical: items.filter(i => i.priority === 'critical'),
    high: items.filter(i => i.priority === 'high'),
    medium: items.filter(i => i.priority === 'medium'),
    low: items.filter(i => i.priority === 'low'),
  };

  const filtered = activeFilter === "all" ? items : items.filter(i => i.priority === activeFilter);

  const renderQuestion = (item: Tables<"interrogatory_items">, i: number) => (
    <BlurFade key={item.id} delay={i * 0.03}>
      <MagicCard className={`border-l-4 ${BORDER_COLORS[item.priority] || ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {item.question_id && (
              <span className="text-[10px] font-mono text-muted-foreground">{item.question_id}</span>
            )}
            {item.module && (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                {item.module}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            item.priority === 'critical' ? 'text-severity-critical' :
            item.priority === 'high' ? 'text-severity-elevated' :
            item.priority === 'medium' ? 'text-score-advance' : 'text-severity-monitor'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[item.priority] || ''}`} />
            {item.priority}
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground">{item.question}</p>
        {item.rationale && (
          <div className="mt-2 rounded-lg bg-muted/50 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Why This Matters</p>
            <p className="text-xs text-muted-foreground">{item.rationale}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border border-border font-medium ${
            item.status === 'resolved' ? 'text-score-strong' : 'text-muted-foreground'
          }`}>
            {item.status === 'resolved' ? '✓ Resolved' : item.status === 'pending' ? '◯ Pending' : '◯ Open'}
          </span>
        </div>
      </MagicCard>
    </BlurFade>
  );

  const renderTier = (priority: string) => {
    const tierItems = grouped[priority as keyof typeof grouped] || [];
    if (tierItems.length === 0) return null;
    const meta = TIER_LABELS[priority];
    return (
      <div key={priority}>
        <div className="flex items-center gap-2 mb-3">
          <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOT[priority] || ''}`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{meta?.title}</p>
            <p className="text-[10px] text-muted-foreground">{meta?.desc}</p>
          </div>
        </div>
        <div className="space-y-3">
          {tierItems.map((item, i) => renderQuestion(item, i))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Interrogatory Matrix</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Structured questions for GP meeting and diligence calls — {fundName}.</p>
        </div>
      </BlurFade>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {PRIORITY_TIERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tiered view for "all" */}
      {activeFilter === "all" ? (
        <div className="space-y-8">
          {renderTier("critical")}
          {renderTier("high")}
          {renderTier("medium")}
          {renderTier("low")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, i) => renderQuestion(item, i))}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center sm:text-left">
        {filtered.length} of {items.length} questions
      </div>
    </div>
  );
}
