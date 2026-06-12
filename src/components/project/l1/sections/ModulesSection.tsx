import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChip, CitationChipRow } from "../primitives/CitationChip";
import { SourceTierBadge } from "../primitives/badges";
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
      eyebrow="06"
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
        className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span className="text-sm font-semibold text-foreground">{MODULE_LABEL[m.key]}</span>
          <span className={cn("text-[11px] font-semibold uppercase tracking-wider", tone)}>{m.verdict_chip}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {score != null && (
            <span className={cn("text-lg font-bold tabular-nums", tone)}>{score}<span className="text-[10px] text-muted-foreground">/100</span></span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
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
              <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-1.5">Related flags</p>
              <div className="flex flex-wrap gap-1.5">
                {m.flag_refs.map((fid) => {
                  const f = payload.flags.items.find((x) => x.id === fid);
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() => { scrollTo(`flag-${fid}`); highlight(`flag-${fid}`); }}
                      className="inline-flex items-center rounded border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-foreground/80 hover:bg-muted"
                      title={f?.statement}
                    >
                      {fid}{f ? ` · ${f.category}` : ""}
                    </button>
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