import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import { NorthStarBadge, TierBadge } from "../primitives/badges";
import { LEDGER_SECTION_ID, setLedgerFilters } from "../primitives/ledgerFilters";
import { cn } from "@/lib/utils";
import type { ChangeOurMindDirection, Disposition } from "@/types/renderContract";

const MODULE_TONE = (score: number) =>
  score >= 75
    ? "border-score-strong/40 text-score-strong bg-score-strong/5"
    : score >= 60
      ? "border-score-advance/40 text-score-advance bg-score-advance/5"
      : score >= 40
        ? "border-severity-elevated/40 text-severity-elevated bg-severity-elevated/5"
        : "border-severity-critical/40 text-severity-critical bg-severity-critical/5";

const TALLY_TONE: Record<Disposition, string> = {
  CONFIRMED: "border-score-strong/40 text-score-strong bg-score-strong/5 hover:bg-score-strong/10",
  CONTRADICTED: "border-severity-critical/40 text-severity-critical bg-severity-critical/5 hover:bg-severity-critical/10",
  UNVERIFIABLE: "border-border text-muted-foreground bg-muted/30 hover:bg-muted",
};

const TALLY_LABEL: Record<Disposition, string> = {
  CONFIRMED: "confirmed",
  CONTRADICTED: "contradicted",
  UNVERIFIABLE: "unverifiable",
};

const CHANGE_TONE: Record<ChangeOurMindDirection, string> = {
  would_advance: "border-score-strong/40 text-score-strong",
  would_decline: "border-severity-critical/40 text-severity-critical",
};

export function VerdictSection() {
  const { payload, scrollTo } = useRefs();
  const v = payload.verdict;
  const [openModule, setOpenModule] = useState<string | null>(null);

  const handleTallyClick = (d: Disposition) => {
    setLedgerFilters({ disposition: d, category: "ALL" });
    scrollTo(LEDGER_SECTION_ID);
  };

  return (
    <SectionShell id="l1-verdict" eyebrow="01" title="Verdict" description="The one-minute answer to: is this deal worth an hour of my time?" disableComments>
      <Card className="p-5 space-y-5" commentId="verdict-summary" commentLabel="Verdict">
        {/* North-star banner */}
        <div className="flex items-start gap-3 flex-wrap">
          <NorthStarBadge answer={v.north_star.answer} />
          <p className="text-sm text-foreground/90 leading-relaxed flex-1 min-w-[260px]">{v.north_star.statement}</p>
        </div>

        {/* Composite */}
        <div className="flex items-center gap-4 flex-wrap border-y border-border/60 py-3">
          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-3xl font-bold text-foreground">{v.composite_score}</span>
            <span className="text-xs text-muted-foreground">/ 100 composite</span>
          </div>
          <TierBadge tier={v.tier} />
        </div>

        {/* Module chips */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Five modules</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {v.modules.map((m) => {
              const open = openModule === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setOpenModule(open ? null : m.key)}
                  className={cn(
                    "text-left rounded-lg border px-2.5 py-2 transition-colors",
                    MODULE_TONE(m.score),
                    open && "ring-1 ring-foreground/20",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold">{m.label}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
                  </div>
                  <div className="text-xl font-bold tabular-nums leading-none mt-1">{m.score}</div>
                  <p className="text-[10px] text-foreground/70 mt-1 leading-snug line-clamp-2">{m.verdict_label}</p>
                </button>
              );
            })}
          </div>
          {v.modules.map(
            (m) =>
              openModule === m.key && (
                <div key={m.key + "-r"} className="mt-2 rounded-lg border border-border/70 bg-background/60 p-3">
                  <p className="text-xs text-foreground/85 leading-relaxed">{m.rationale}</p>
                  <div className="mt-2"><CitationChipRow ids={m.citation_ids} /></div>
                </div>
              ),
          )}
        </div>

        {/* Tally pills */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Claims tally</p>
          <div className="flex flex-wrap gap-2">
            {(["CONFIRMED", "CONTRADICTED", "UNVERIFIABLE"] as Disposition[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleTallyClick(d)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  TALLY_TONE[d],
                )}
              >
                <span className="tabular-nums font-bold">{v.claims_tally[d.toLowerCase() as keyof typeof v.claims_tally]}</span>
                <span className="lowercase">{TALLY_LABEL[d]}</span>
              </button>
            ))}
            <span className="text-[10px] text-muted-foreground self-center ml-1">Click to jump to ledger, pre-filtered.</span>
          </div>
        </div>

        {/* What would change our mind */}
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">What would change our mind</p>
          <ul className="space-y-2">
            {v.change_our_mind.map((c, i) => (
              <li key={i} className={cn("rounded-md border-l-2 pl-3 py-1", CHANGE_TONE[c.direction])}>
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {c.direction === "would_advance" ? "Would advance" : "Would decline"}
                  </span>
                  <p className="text-xs text-foreground/85 leading-snug flex-1 min-w-[200px]">{c.item}</p>
                </div>
                {c.question_refs.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.question_refs.map((qid) => (
                      <QuestionRefChip key={qid} qid={qid} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </SectionShell>
  );
}

function QuestionRefChip({ qid }: { qid: string }) {
  const { questions, flags, scrollTo, highlight } = useRefs();
  const q = questions.get(qid);
  const flagId = q?.flag_ref ?? null;
  const targetId = flagId ? `flag-${flagId}` : `q-${qid}`;
  const label = flagId ? `${qid} → ${flags.get(flagId)?.category ?? "flag"}` : qid;
  return (
    <button
      type="button"
      onClick={() => {
        scrollTo(targetId);
        highlight(targetId);
      }}
      className="inline-flex items-center rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-foreground/80 hover:bg-muted"
      title={q?.text ?? `Question ${qid}`}
    >
      {label}
    </button>
  );
}