import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import type { AgendaItem } from "@/types/renderContract";
import { Clock } from "lucide-react";

export function AgendaSection() {
  const { payload, scrollTo, highlight, questions, claims } = useRefs();
  const a = payload.agenda;
  const totalMin = a.items.reduce((sum, i) => sum + i.minutes, 0);

  return (
    <SectionShell
      id="l1-agenda"
      eyebrow="01"
      title="Meeting Agenda"
      description={`${a.items.length} topics · ${totalMin} min total.`}
      disableComments
    >
      <div className="space-y-3">
        <Card className="p-4 bg-muted/20" commentId="agenda-objective" commentLabel="Objective">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-1">Objective</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{a.objective}</p>
        </Card>

        <Card className="p-0" commentId="agenda-topics" commentLabel="Agenda topics">
          <ol className="divide-y divide-border/60">
            {a.items.map((item) => <AgendaRow key={item.order} item={item} />)}
          </ol>
        </Card>

        {a.standalone_asks.length > 0 && (
          <Card className="p-4" commentId="agenda-standalone-asks" commentLabel="Standalone asks">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">Standalone asks</p>
            <ul className="space-y-2">
              {a.standalone_asks.map((qid) => {
                const q = questions.get(qid);
                if (!q) return null;
                return (
                  <Subcard key={qid}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm text-foreground/90 leading-snug flex-1">{q.text}</p>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{qid}</span>
                    </div>
                    {q.why && (
                      <p className="text-[11px] text-muted-foreground italic leading-snug">
                        <span className="not-italic uppercase tracking-wider text-[9px] font-semibold mr-1">Why</span>
                        {q.why}
                      </p>
                    )}
                  </Subcard>
                );
              })}
            </ul>
          </Card>
        )}

        {a.materials_request.length > 0 && (
          <Card className="p-4" commentId="agenda-materials-request" commentLabel="Materials request">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">Materials request</p>
            <ul className="space-y-2">
              {a.materials_request.map((m, i) => (
                <Subcard key={i}>
                  <p className="text-sm font-semibold text-foreground leading-snug">{m.item}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.reason}</p>
                  {m.claim_refs.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.claim_refs.map((cid) => {
                        const c = claims.get(cid);
                        return (
                          <span
                            key={cid}
                            className="inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-foreground/80"
                            title={c?.claim ?? cid}
                          >
                            {cid}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </Subcard>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-4 border-foreground/30 bg-foreground/5" commentId="agenda-decision-rule" commentLabel="Decision rule">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-1">Decision rule</p>
          <p className="text-sm text-foreground leading-relaxed">{a.decision_rule}</p>
        </Card>
      </div>
    </SectionShell>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold">
          {item.order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-foreground">{item.topic}</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />{item.minutes} min
            </span>
          </div>
          <p className="text-xs text-foreground/85 leading-snug mb-2">
            <span className="text-[10px] uppercase tracking-wider text-nvestiv-teal font-semibold mr-1">What to validate</span>
            {item.what_to_validate}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded border border-score-strong/30 bg-score-strong/5 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-score-strong mb-0.5">Strong answer</p>
              <p className="text-[11px] text-foreground/85 leading-snug">{item.listen_for.strong}</p>
            </div>
            <div className="rounded border border-severity-critical/30 bg-severity-critical/5 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-severity-critical mb-0.5">Weak answer</p>
              <p className="text-[11px] text-foreground/85 leading-snug">{item.listen_for.weak}</p>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}