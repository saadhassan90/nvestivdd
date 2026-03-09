import { useState } from "react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

interface InterrogatoryTabProps {
  items: Tables<"interrogatory_items">[];
  fundName: string;
}

const PRIORITY_FILTERS = [
  { key: "all", label: "All Questions", dot: "" },
  { key: "critical", label: "Critical", dot: "bg-severity-critical" },
  { key: "high", label: "High", dot: "bg-severity-elevated" },
  { key: "medium", label: "Medium", dot: "bg-score-strong" },
  { key: "low", label: "Low", dot: "bg-severity-monitor" },
];

const BORDER_COLORS: Record<string, string> = {
  critical: "border-l-severity-critical",
  high: "border-l-severity-elevated",
  medium: "border-l-score-strong",
  low: "border-l-severity-monitor",
};

export function InterrogatoryTab({ items, fundName }: InterrogatoryTabProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = activeFilter === "all"
    ? items
    : items.filter(i => i.priority === activeFilter);

  return (
    <div className="space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-xl font-bold text-foreground">Interrogatory Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">Review and manage technical inquiries for {fundName}.</p>
        </div>
      </BlurFade>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {PRIORITY_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.dot && <span className={`h-2 w-2 rounded-full ${f.dot}`} />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Question cards */}
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <BlurFade key={item.id} delay={i * 0.05}>
            <MagicCard className={`border-l-4 ${BORDER_COLORS[item.priority] || ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-muted-foreground">ID: {item.question_id}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.priority === 'critical' ? 'text-severity-critical' :
                      item.priority === 'high' ? 'text-severity-elevated' :
                      item.priority === 'medium' ? 'text-score-strong' : 'text-severity-monitor'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.question}</p>
                  {item.rationale && (
                    <div className="mt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Rationale</p>
                      <p className="text-xs text-muted-foreground">{item.rationale}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted" />
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    </div>
                    <button className="text-xs font-medium text-foreground hover:text-muted-foreground transition-colors">
                      RESOLVE →
                    </button>
                  </div>
                </div>
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {items.length} inquiries</span>
      </div>
    </div>
  );
}
