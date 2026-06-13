import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChip, CitationChipRow } from "../primitives/CitationChip";
import { SourceTierBadge, FlagSeverityBadge } from "../primitives/badges";
import { MODULE_LABEL, MODULE_ORDER, type Module, type ModuleKey } from "@/types/renderContract";
import { cn } from "@/lib/utils";

export function ModulesSection() {
  const { payload } = useRefs();
  const byKey: Partial<Record<ModuleKey, Module>> = {};
  for (const m of payload.modules) byKey[m.key] = m;
  const ordered = MODULE_ORDER.map((k) => byKey[k]).filter((m): m is Module => !!m);
  return (
    <SectionShell
      id="l1-modules"
      eyebrow="03"
      title="Modules"
      description="One level deeper on each of the five dimensions — collapsed by default."
      disableComments
    >
      <div className="space-y-2">
        {ordered.map((m) => <ModuleCard key={m.key} m={m} />)}
      </div>
    </SectionShell>
  );
}

function moduleScore(key: ModuleKey, refsScore: number | undefined) {
  return refsScore ?? null;
}

function ModuleCard({ m }: { m: Module }) {
  const { payload, scrollTo, highlight } = useRefs();
  const [open, setOpen] = useState(false);
  const score = payload.verdict.modules.find((x) => x.key === m.key)?.score ?? null;
  const tone = score == null
    ? "border-border text-muted-foreground"
    : score >= 75 ? "text-score-strong"
      : score >= 60 ? "text-score-advance"
        : score >= 40 ? "text-severity-elevated" : "text-severity-critical";

  return (
    <Card className="overflow-hidden" commentId={`module-${m.key}`} commentLabel={MODULE_LABEL[m.key]}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
        <span className="text-sm font-semibold text-foreground">{MODULE_LABEL[m.key]}</span>
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider", tone)}>{m.verdict_chip}</span>
        <div className="flex-1" />
        {score != null && (
          <span className={cn("text-lg font-bold tabular-nums shrink-0", tone)}>{score}<span className="text-[10px] text-muted-foreground">/100</span></span>
        )}
      </button>

      {/* KPI strip always visible */}
      {m.kpis.length > 0 && (
        <div className="border-t border-border/60 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {m.kpis.map((k, i) => (
            <div key={i} className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-nvestiv-teal truncate">{k.label}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {k.value}{k.unit ? <span className="text-[10px] text-muted-foreground ml-0.5">{k.unit}</span> : null}
              </p>
              {(k.benchmark || k.delta) && (
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {k.benchmark}{k.delta ? ` · ${k.delta}` : ""}
                </p>
              )}
              <CitationChipRow ids={k.citation_ids} className="mt-0.5" />
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4 bg-background/40">
          <div className="prose prose-sm max-w-none prose-p:text-foreground/85 prose-p:leading-relaxed">
            <ReactMarkdown>{m.narrative_md}</ReactMarkdown>
          </div>

          {m.facts.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">Facts</p>
              <ul className="space-y-2">
                {m.facts.map((f, i) => (
                  <Subcard key={i}>
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                      <SourceTierBadge tier={f.source_tier} />
                      <CitationChip id={f.citation_id} />
                    </div>
                    <p className="text-xs text-foreground/85 leading-snug">{f.statement}</p>
                  </Subcard>
                ))}
              </ul>
            </div>
          )}

          {m.flag_refs.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">Related flags</p>
              <div className="space-y-2">
                {m.flag_refs.map((fid) => {
                  const f = payload.flags.items.find((x) => x.id === fid);
                  if (!f) return null;
                  const linked = f.question_refs
                    .map((qid) => payload.flags.questions.find((q) => q.id === qid))
                    .filter((q): q is NonNullable<typeof q> => !!q);
                  const accent = f.severity === "CRITICAL"
                    ? "border-l-4 border-l-severity-critical"
                    : "border-l-4 border-l-severity-elevated";
                  return (
                    <div
                      key={fid}
                      id={`flag-${fid}`}
                      className={cn("scroll-mt-28 rounded-md border border-border bg-background/60 p-3", accent)}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FlagSeverityBadge s={f.severity} />
                          <span className="text-[10px] uppercase tracking-wider text-nvestiv-teal">{f.category}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{f.id}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-snug">{f.statement}</p>
                      {f.evidence && (
                        <p className="text-xs text-muted-foreground mt-1 leading-snug">{f.evidence}</p>
                      )}
                      <div className="mt-1.5"><CitationChipRow ids={f.citation_ids} /></div>

                      {linked.length > 0 && (
                        <div className="mt-2.5 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal">
                            Questions to ask <span className="tabular-nums">({linked.length})</span>
                          </p>
                          {linked.map((q) => (
                            <Subcard key={q.id} id={`q-${q.id}`} className="scroll-mt-28">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-sm text-foreground/90 leading-snug flex-1">{q.text}</p>
                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{q.id}</span>
                              </div>
                              {q.why && (
                                <p className="text-[11px] text-muted-foreground italic leading-snug">
                                  <span className="not-italic uppercase tracking-wider text-[9px] font-semibold mr-1">Why</span>
                                  {q.why}
                                </p>
                              )}
                            </Subcard>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}