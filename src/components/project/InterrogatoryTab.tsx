import { useState } from "react";
import { Card, CardBody, Chip, Button } from "@heroui/react";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";

const MODULE_LABELS: Record<string, string> = {
  module_a: "Financial & Performance",
  module_b: "Team & Management",
  module_c: "Strategy & Market",
  module_d: "Terms & Structure",
  module_e: "Operational",
};

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

const PRIORITY_COLOR: Record<string, "danger" | "warning" | "primary" | "default"> = {
  critical: "danger",
  high: "warning",
  medium: "primary",
  low: "default",
};

const BORDER_COLORS: Record<string, string> = {
  critical: "border-l-danger",
  high: "border-l-warning",
  medium: "border-l-primary",
  low: "border-l-default-300",
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
      <Card shadow="sm" className={`border-l-4 ${BORDER_COLORS[item.priority] || ''}`}>
        <CardBody className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {item.question_id && (
                <span className="text-[10px] font-mono text-default-400">{item.question_id}</span>
              )}
              {item.module && (
                <Chip size="sm" variant="flat" classNames={{ content: "text-[9px]" }}>
                  {MODULE_LABELS[item.module] || item.module}
                </Chip>
              )}
            </div>
            <Chip size="sm" color={PRIORITY_COLOR[item.priority] || "default"} variant="dot">
              {item.priority}
            </Chip>
          </div>
          <p className="text-sm font-semibold text-foreground">{item.question}</p>
          {item.rationale && (
            <div className="mt-2 rounded-xl bg-default-50 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-default-400 mb-0.5">Why This Matters</p>
              <p className="text-xs text-default-500">{item.rationale}</p>
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <Chip
              size="sm"
              variant="bordered"
              color={item.status === 'resolved' ? 'success' : 'default'}
            >
              {item.status === 'resolved' ? '✓ Resolved' : item.status === 'pending' ? '◯ Pending' : '◯ Open'}
            </Chip>
          </div>
        </CardBody>
      </Card>
    </BlurFade>
  );

  const renderTier = (priority: string) => {
    const tierItems = grouped[priority as keyof typeof grouped] || [];
    if (tierItems.length === 0) return null;
    const meta = TIER_LABELS[priority];
    const dotColor = PRIORITY_COLOR[priority] || "default";
    return (
      <div key={priority}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-2.5 w-2.5 rounded-full ${
            dotColor === 'danger' ? 'bg-danger' : dotColor === 'warning' ? 'bg-warning' : dotColor === 'primary' ? 'bg-primary' : 'bg-default-300'
          }`} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{meta?.title}</p>
            <p className="text-[10px] text-default-400">{meta?.desc}</p>
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
          <p className="text-xs sm:text-sm text-default-400 mt-1">Structured questions for GP meeting and diligence calls — {fundName}.</p>
        </div>
      </BlurFade>

      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {PRIORITY_TIERS.map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={activeFilter === f.key ? "solid" : "bordered"}
            color={activeFilter === f.key ? "primary" : "default"}
            onPress={() => setActiveFilter(f.key)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

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

      <div className="text-xs text-default-400 text-center sm:text-left">
        {filtered.length} of {items.length} questions
      </div>
    </div>
  );
}
