import { AlertOctagon, AlertTriangle, Eye, MessageSquare, HelpCircle } from "lucide-react";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { CitationRefs } from "@/components/project/typed/CitationRefs";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Module-scoped flag + flag-bound diligence questions block.
 *
 * Layout (per L1 PRD revision):
 *   1. Flag list (filtered to this module). Each flag shows:
 *      - severity dot + title
 *      - "Why it was raised" (issue / description)
 *      - implication (if present)
 *      - inline citations (red_flags carry no citation_ids today; degrades silently)
 *      - linked questions with rationale + good answer / bad answer direction
 *   2. Unattributed observations — questions not linked to any flag in this
 *      module, grouped at the bottom so analysts still see them.
 */

interface ModuleFlagBlockProps {
  /** Substrings used to match flag.module / flag.source_module / question.module. */
  moduleKeys: string[];
  redFlags: Tables<"red_flags">[];
  interrogatoryItems: Tables<"interrogatory_items">[];
  /** Friendly module label for empty-state copy. */
  moduleLabel: string;
}

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-severity-critical",
  elevated: "bg-severity-elevated",
  monitor: "bg-muted-foreground",
};

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-severity-critical/40 border-l-4 border-l-severity-critical bg-severity-critical/5",
  elevated: "border-severity-elevated/40 border-l-4 border-l-severity-elevated bg-severity-elevated/5",
  monitor: "border-border border-l-4 border-l-muted-foreground bg-muted/20",
};

function matchesModule(value: string | null | undefined, keys: string[]): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return keys.some((k) => v.includes(k));
}

export function ModuleFlagBlock({
  moduleKeys,
  redFlags,
  interrogatoryItems,
  moduleLabel,
}: ModuleFlagBlockProps) {
  const keys = moduleKeys.map((k) => k.toLowerCase());

  const flagsInModule = redFlags.filter(
    (f) => matchesModule(f.module, keys) || matchesModule(f.source_module, keys),
  );

  const questionsInModule = interrogatoryItems.filter(
    (q) => matchesModule(q.module, keys) || matchesModule(q.source_module, keys),
  );

  // Index questions by linked red-flag id so each flag can render its questions inline.
  const questionsByFlag = new Map<string, Tables<"interrogatory_items">[]>();
  const linkedQuestionIds = new Set<string>();
  for (const q of questionsInModule) {
    const links = (q.related_red_flag_ids as string[] | null) || [];
    for (const flagId of links) {
      if (!questionsByFlag.has(flagId)) questionsByFlag.set(flagId, []);
      questionsByFlag.get(flagId)!.push(q);
      linkedQuestionIds.add(q.id);
    }
  }
  const unattributed = questionsInModule.filter((q) => !linkedQuestionIds.has(q.id));

  const Icon =
    flagsInModule.some((f) => f.severity === "critical")
      ? AlertOctagon
      : flagsInModule.some((f) => f.severity === "elevated")
        ? AlertTriangle
        : Eye;

  return (
    <SectionCard
      title="Flags & Questions"
      subtitle={
        flagsInModule.length > 0
          ? `${flagsInModule.length} flag${flagsInModule.length === 1 ? "" : "s"} in ${moduleLabel} · each with the questions to ask`
          : `No flags raised in ${moduleLabel} · unattributed questions below`
      }
      icon={<Icon className="h-4 w-4" />}
      empty={flagsInModule.length === 0 && unattributed.length === 0}
      emptyMessage={`No flags or diligence questions scoped to ${moduleLabel} at L1.`}
    >
      <div className="space-y-3">
        {flagsInModule.map((flag) => {
          const linked = questionsByFlag.get(flag.id) ?? [];
          return <FlagCard key={flag.id} flag={flag} linked={linked} moduleLabel={moduleLabel} />;
        })}

        {unattributed.length > 0 && (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold text-muted-foreground">
              <HelpCircle className="h-3 w-3" />
              Unattributed observations
              <span className="font-mono tabular-nums">({unattributed.length})</span>
            </div>
            <p className="text-[10px] text-muted-foreground italic mb-2 leading-snug">
              Questions scoped to {moduleLabel} that are not linked to a flag yet — treat as data-quality signal.
            </p>
            <ul className="space-y-2">
              {unattributed.map((q) => (
                <QuestionRow key={q.id} q={q} moduleLabel={moduleLabel} compact />
              ))}
            </ul>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ─── Flag card ─────────────────────────────────────────────────────── */

function FlagCard({
  flag,
  linked,
  moduleLabel,
}: {
  flag: Tables<"red_flags">;
  linked: Tables<"interrogatory_items">[];
  moduleLabel: string;
}) {
  const sev = (flag.severity || "monitor").toLowerCase();
  return (
    <div className={cn("rounded-lg border p-3", SEVERITY_BORDER[sev] || SEVERITY_BORDER.monitor)}>
      <div className="flex items-start gap-2">
        <span
          className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", SEVERITY_DOT[sev] || SEVERITY_DOT.monitor)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-foreground leading-snug">{flag.title}</p>
            <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
              {flag.severity}
            </span>
          </div>

          {(flag.issue || flag.description) && (
            <div className="mt-1.5">
              <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">
                Why it was raised
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {flag.issue || flag.description}
              </p>
            </div>
          )}

          {flag.implication && (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">
                Implication
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">{flag.implication}</p>
            </div>
          )}

          {/* Linked questions */}
          {linked.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-border/40 pt-2.5">
              <p className="text-[10px] text-muted-foreground font-semibold inline-flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Questions tied to this flag ({linked.length})
              </p>
              <ul className="space-y-2.5">
                {linked.map((q) => (
                  <QuestionRow key={q.id} q={q} moduleLabel={moduleLabel} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Question row ──────────────────────────────────────────────────── */

function QuestionRow({
  q,
  moduleLabel,
  compact = false,
}: {
  q: Tables<"interrogatory_items">;
  moduleLabel: string;
  compact?: boolean;
}) {
  const good = (q as any).good_answer_direction as string | null | undefined;
  const bad = (q as any).bad_answer_direction as string | null | undefined;
  return (
    <li
      className={cn(
        "rounded-md border border-border bg-card",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs text-foreground font-medium leading-snug min-w-0">{q.question}</p>
        {q.priority && (
          <span
            className={cn(
              "text-[9px] font-semibold shrink-0 rounded-full px-1.5 py-0.5",
              q.priority === "critical"
                ? "bg-severity-critical/15 text-severity-critical"
                : q.priority === "high"
                  ? "bg-severity-elevated/15 text-severity-elevated"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {q.priority}
          </span>
        )}
      </div>
      {q.rationale && (
        <div className="text-[11px] leading-relaxed text-foreground/75 mb-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold mr-1">
            Rationale
          </span>
          {q.rationale}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        <AnswerBlock
          label="Good answer looks like"
          tone="good"
          text={good}
          empty="—"
        />
        <AnswerBlock
          label="Bad answer looks like"
          tone="bad"
          text={bad}
          empty="—"
        />
      </div>
      {Array.isArray((q as any).citation_ids) && (q as any).citation_ids.length > 0 && (
        <div className="mt-1.5">
          <CitationRefs ids={(q as any).citation_ids as string[]} sectionHint={moduleLabel} />
        </div>
      )}
    </li>
  );
}

function AnswerBlock({
  label,
  tone,
  text,
  empty,
}: {
  label: string;
  tone: "good" | "bad";
  text?: string | null;
  empty: string;
}) {
  const toneClass =
    tone === "good"
      ? "border-score-strong/30 bg-score-strong/5"
      : "border-severity-critical/30 bg-severity-critical/5";
  const labelClass =
    tone === "good" ? "text-score-strong" : "text-severity-critical";
  return (
    <div className={cn("rounded border px-2 py-1.5", toneClass)}>
      <p className={cn("text-[10px] font-semibold mb-0.5", labelClass)}>
        {label}
      </p>
      <p className="text-[11px] text-foreground/85 leading-snug">
        {text && text.trim().length > 0 ? text : <span className="italic text-muted-foreground">{empty}</span>}
      </p>
    </div>
  );
}