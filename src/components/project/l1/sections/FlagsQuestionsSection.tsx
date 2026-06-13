import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import { FlagSeverityBadge } from "../primitives/badges";
import type { Flag, FlagQuestion } from "@/types/renderContract";
import { cn } from "@/lib/utils";

export function FlagsQuestionsSection() {
  const { payload } = useRefs();
  const items = [...payload.flags.items].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "CRITICAL" ? -1 : 1,
  );
  const standalone = payload.flags.questions.filter((q) => !q.flag_ref);

  return (
    <SectionShell
      id="l1-flags"
      eyebrow="02"
      title="Flags & Questions"
      description="Each flag carries the clarifying question(s) inline. Question text appears here only."
      disableComments
    >
      <div className="space-y-3">
        {items.map((f) => <FlagCard key={f.id} flag={f} />)}
        {standalone.length > 0 && (
          <Card className="p-4" commentId="flags-additional-asks" commentLabel="Additional asks">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">
              Additional asks <span className="tabular-nums">({standalone.length})</span>
            </p>
            <ul className="space-y-2">
              {standalone.map((q) => <StandaloneQuestion key={q.id} q={q} />)}
            </ul>
          </Card>
        )}
      </div>
    </SectionShell>
  );
}

function FlagCard({ flag }: { flag: Flag }) {
  const { questions } = useRefs();
  const linked = flag.question_refs
    .map((id) => questions.get(id))
    .filter((q): q is FlagQuestion => !!q);
  const accent = flag.severity === "CRITICAL"
    ? "border-l-4 border-l-severity-critical"
    : "border-l-4 border-l-severity-elevated";
  return (
    <Card id={`flag-${flag.id}`} className={cn("p-4 scroll-mt-28", accent)} commentId={`flag-${flag.id}`} commentLabel={flag.category}>
      <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <FlagSeverityBadge s={flag.severity} />
          <span className="text-[10px] uppercase tracking-wider text-nvestiv-teal">{flag.category}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{flag.id}</span>
        </div>
        {flag.tokens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flag.tokens.map((t) => (
              <span key={t} className="font-mono text-[9px] uppercase tracking-wider bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug">{flag.statement}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{flag.evidence}</p>
      <div className="mt-1.5"><CitationChipRow ids={flag.citation_ids} /></div>

      {linked.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal">
            Questions to ask <span className="tabular-nums">({linked.length})</span>
          </p>
          {linked.map((q) => (
            <Subcard key={q.id} id={`q-${q.id}`} className="scroll-mt-28">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm text-foreground/90 leading-snug flex-1">{q.text}</p>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{q.id}</span>
              </div>
              <p className="text-[11px] text-muted-foreground italic leading-snug">
                <span className="not-italic uppercase tracking-wider text-[9px] font-semibold mr-1">Why</span>
                {q.why}
              </p>
            </Subcard>
          ))}
        </div>
      )}
    </Card>
  );
}

function StandaloneQuestion({ q }: { q: FlagQuestion }) {
  return (
    <li id={`q-${q.id}`} className="rounded-md border border-border/60 bg-background/40 p-3 scroll-mt-28">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm text-foreground/90 leading-snug flex-1">{q.text}</p>
        <span className="font-mono text-[10px] text-muted-foreground shrink-0">{q.id}</span>
      </div>
      <p className="text-[11px] text-muted-foreground italic leading-snug">{q.why}</p>
    </li>
  );
}