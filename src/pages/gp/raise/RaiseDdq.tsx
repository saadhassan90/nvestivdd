import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, CheckCircle2, Sparkles, RotateCcw, Plus, FileCheck2 } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ------------------------------ Standard Nvestiv DDQ ------------------------------ */

type TemplateQuestion = { id: string; question: string; placeholder?: string };
type TemplateSection = { key: string; title: string; questions: TemplateQuestion[] };

const NVESTIV_DDQ: TemplateSection[] = [
  {
    key: "firm",
    title: "Firm & Governance",
    questions: [
      { id: "firm.ownership", question: "Describe the firm's ownership structure and any changes in the past 5 years.", placeholder: "Ownership %, GP stake holders, recent changes…" },
      { id: "firm.ic", question: "Detail the investment committee composition and voting protocol.", placeholder: "Members, quorum, voting rules, tie-break…" },
      { id: "firm.conflicts", question: "How are conflicts of interest identified, escalated and resolved?" },
    ],
  },
  {
    key: "strategy",
    title: "Strategy",
    questions: [
      { id: "strategy.thesis", question: "Summarize the fund's investment thesis and edge." },
      { id: "strategy.check", question: "What is the typical check size, ownership target and pace?" },
      { id: "strategy.pipeline", question: "Describe the current pipeline and conversion expectations." },
    ],
  },
  {
    key: "track",
    title: "Track Record",
    questions: [
      { id: "track.realized", question: "Provide realized gross/net IRR, DPI and TVPI by vintage." },
      { id: "track.losses", question: "Walk through underwriting on the 3 largest realized losses." },
      { id: "track.loss-ratio", question: "What is the projected loss ratio across the realized portfolio?" },
    ],
  },
  {
    key: "team",
    title: "Team",
    questions: [
      { id: "team.bios", question: "Senior team bios, tenure and continuity across funds." },
      { id: "team.attrition", question: "Senior attrition over the past 5 years and stated reasons." },
    ],
  },
  {
    key: "terms",
    title: "Terms & Economics",
    questions: [
      { id: "terms.fees", question: "Management fee, carry, hurdle, waterfall structure." },
      { id: "terms.gp-commit", question: "How is the GP commit funded and over what period?" },
      { id: "terms.recycling", question: "Recycling provision mechanics and cap." },
    ],
  },
  {
    key: "ops",
    title: "Operations & ESG",
    questions: [
      { id: "ops.admin", question: "Fund administrator, auditor and prime broker / custodians." },
      { id: "ops.esg", question: "ESG integration framework, including SFDR classification." },
    ],
  },
];

const ALL_QIDS = NVESTIV_DDQ.flatMap((s) => s.questions.map((q) => q.id));

/* ------------------------------ Persistence ------------------------------ */

type Answer = { value: string; updatedAt: string };
type NewQuestion = { id: string; question: string; section: string; source: string; addedAt: string };
type DdqStore = {
  submittedAt: string | null;
  answers: Record<string, Answer>;
  newQuestions: NewQuestion[];
};

const storageKey = (fundId: string) => `nvestiv.ddq.${fundId}`;

function loadStore(fundId: string): DdqStore {
  try {
    const raw = localStorage.getItem(storageKey(fundId));
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return { submittedAt: null, answers: {}, newQuestions: [] };
}
function saveStore(fundId: string, s: DdqStore) {
  try { localStorage.setItem(storageKey(fundId), JSON.stringify(s)); } catch {/* ignore */}
}

/* Sample LP-surfaced follow-ups (used by the "Simulate new questions" demo) */
const SIMULATED_NEW: NewQuestion[] = [
  { id: "new.concentration", question: "Provide concentration metrics: top-5 positions as % of NAV across the realized portfolio.", section: "Track Record", source: "Atlas State Pension", addedAt: new Date().toISOString() },
  { id: "new.lgd", question: "Detail your loss-given-default methodology and any backtesting against realized outcomes.", section: "Track Record", source: "Westbrook Endowment", addedAt: new Date().toISOString() },
  { id: "new.sfdr", question: "Confirm SFDR classification target and the path to reach it before first close.", section: "Operations & ESG", source: "Northern Mutual", addedAt: new Date().toISOString() },
];

/* ------------------------------ Page ------------------------------ */

export default function RaiseDdq() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const { toast } = useToast();

  const [store, setStore] = useState<DdqStore>(() => loadStore(fundId || ""));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NVESTIV_DDQ.map((s) => [s.key, true])),
  );

  // Reload when fund changes
  useEffect(() => {
    if (!fundId) return;
    setStore(loadStore(fundId));
    setDrafts({});
  }, [fundId]);

  // Persist
  useEffect(() => {
    if (!fundId) return;
    saveStore(fundId, store);
  }, [fundId, store]);

  if (!raise) return null;

  const answeredCount = ALL_QIDS.filter((id) => store.answers[id]?.value?.trim()).length;
  const completion = Math.round((answeredCount / ALL_QIDS.length) * 100);
  const hasNew = store.newQuestions.length > 0;
  const isComplete = store.submittedAt && answeredCount === ALL_QIDS.length && !hasNew;
  const phase: "empty" | "filling" | "complete" | "new" =
    hasNew ? "new"
    : isComplete ? "complete"
    : store.submittedAt ? "filling"
    : answeredCount === 0 ? "empty"
    : "filling";

  const setDraft = (id: string, v: string) => setDrafts((p) => ({ ...p, [id]: v }));
  const setAnswer = (id: string, value: string) => {
    setStore((s) => ({ ...s, answers: { ...s.answers, [id]: { value, updatedAt: new Date().toISOString() } } }));
  };

  const submitAll = () => {
    // Commit all drafts to answers
    const next: Record<string, Answer> = { ...store.answers };
    for (const [id, val] of Object.entries(drafts)) {
      if (val?.trim()) next[id] = { value: val.trim(), updatedAt: new Date().toISOString() };
    }
    setStore((s) => ({ ...s, answers: next, submittedAt: new Date().toISOString() }));
    setDrafts({});
    toast({ title: "DDQ submitted", description: "Your responses are now visible to invited LPs." });
  };

  const resetDdq = () => {
    setStore({ submittedAt: null, answers: {}, newQuestions: [] });
    setDrafts({});
    toast({ title: "DDQ reset", description: "Cleared all answers and surfaced questions." });
  };

  const simulateNew = () => {
    const existing = new Set(store.newQuestions.map((q) => q.id));
    const toAdd = SIMULATED_NEW.filter((q) => !existing.has(q.id));
    if (toAdd.length === 0) {
      toast({ title: "No new questions", description: "All sample LP follow-ups are already surfaced." });
      return;
    }
    setStore((s) => ({ ...s, newQuestions: [...toAdd, ...s.newQuestions] }));
    toast({ title: `${toAdd.length} new question${toAdd.length === 1 ? "" : "s"} surfaced`, description: "Pinned to the top for your attention." });
  };

  const answerNew = (q: NewQuestion, value: string) => {
    if (!value.trim()) return;
    setStore((s) => ({
      ...s,
      answers: { ...s.answers, [q.id]: { value: value.trim(), updatedAt: new Date().toISOString() } },
      newQuestions: s.newQuestions.filter((n) => n.id !== q.id),
    }));
    setDrafts((d) => {
      const rest = { ...d };
      delete rest[q.id];
      return rest;
    });
    toast({ title: "Response saved", description: "Question moved into your DDQ." });
  };

  return (
    <GpPagePlaceholder>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Nvestiv Standard DDQ</h2>
            <PhaseBadge phase={phase} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {phase === "empty" && "Fill out the standard Nvestiv DDQ. Sections expand below."}
            {phase === "filling" && "Continue answering. Your draft is saved automatically."}
            {phase === "complete" && "DDQ complete. Review or edit answers below."}
            {phase === "new" && "New questions from LPs are pinned at the top — answer them to return to complete."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={simulateNew} title="Demo: surface new LP questions">
            <Plus className="h-3 w-3 mr-1" /> Simulate new
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground" onClick={resetDdq} title="Reset to empty state">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 mb-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Completion</span>
          <span className="tabular-nums text-foreground">{answeredCount}/{ALL_QIDS.length} answered · {completion}%</span>
        </div>
        <Progress value={completion} className="h-1.5" />
      </div>

      {/* New questions pinned at top */}
      {hasNew && (
        <div className="space-y-2 mb-5">
          {store.newQuestions.map((q) => (
            <NewQuestionCard
              key={q.id}
              q={q}
              draft={drafts[q.id] || ""}
              onDraft={(v) => setDraft(q.id, v)}
              onSubmit={() => answerNew(q, drafts[q.id] || "")}
            />
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {NVESTIV_DDQ.map((section) => {
          const open = openSections[section.key];
          const sectionAnswered = section.questions.filter((q) => store.answers[q.id]?.value?.trim()).length;
          return (
            <div key={section.key} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenSections((p) => ({ ...p, [section.key]: !p[section.key] }))}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="text-sm font-semibold text-foreground">{section.title}</span>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {sectionAnswered}/{section.questions.length}
                </span>
              </button>
              {open && (
                <div className="border-t border-border divide-y divide-border">
                  {section.questions.map((q) => (
                    <QuestionRow
                      key={q.id}
                      q={q}
                      answer={store.answers[q.id]}
                      draft={drafts[q.id]}
                      onDraft={(v) => setDraft(q.id, v)}
                      onSave={(v) => { setAnswer(q.id, v); setDraft(q.id, ""); }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit bar (only while filling for the first time) */}
      {!store.submittedAt && (
        <div className="sticky bottom-3 mt-5 rounded-lg border border-border bg-card/95 backdrop-blur px-4 py-3 flex items-center justify-between shadow-sm">
          <p className="text-xs text-muted-foreground">
            {completion < 100
              ? "You can submit at any time and continue editing later."
              : "All questions answered. Submit to publish your DDQ."}
          </p>
          <Button size="sm" className="h-8 text-[12px]" onClick={submitAll}>
            <FileCheck2 className="h-3.5 w-3.5 mr-1.5" />
            {completion === 100 ? "Submit DDQ" : "Submit draft"}
          </Button>
        </div>
      )}
    </GpPagePlaceholder>
  );
}

/* ------------------------------ Subcomponents ------------------------------ */

function PhaseBadge({ phase }: { phase: "empty" | "filling" | "complete" | "new" }) {
  const map: Record<typeof phase, { label: string; cls: string; Icon: React.ElementType }> = {
    empty: { label: "Not started", cls: "border-border text-muted-foreground bg-muted/40", Icon: FileCheck2 },
    filling: { label: "In progress", cls: "border-border text-foreground bg-muted/40", Icon: FileCheck2 },
    complete: { label: "Complete", cls: "border-score-strong/30 text-score-strong bg-score-strong/10", Icon: CheckCircle2 },
    new: { label: "New questions", cls: "border-destructive/40 text-destructive bg-destructive/10", Icon: Sparkles },
  };
  const { label, cls, Icon } = map[phase];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function QuestionRow({
  q, answer, draft, onDraft, onSave,
}: {
  q: TemplateQuestion;
  answer?: Answer;
  draft?: string;
  onDraft: (v: string) => void;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const hasAnswer = !!answer?.value?.trim();
  const value = draft !== undefined ? draft : "";
  const showEditor = !hasAnswer || editing;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2">
        {hasAnswer ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-score-strong mt-0.5 shrink-0" />
        ) : (
          <span className="mt-1 h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />
        )}
        <p className="text-[13px] text-foreground leading-snug">{q.question}</p>
      </div>

      {hasAnswer && !editing && (
        <div className="pl-5 mt-2">
          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{answer!.value}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground/70">Saved {formatDate(answer!.updatedAt)}</span>
            <button
              onClick={() => { onDraft(answer!.value); setEditing(true); }}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {showEditor && (
        <div className="pl-5 mt-2 space-y-2">
          <Textarea
            value={value}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={q.placeholder || "Type your response…"}
            className="min-h-[72px] text-[13px]"
          />
          <div className="flex justify-end gap-2">
            {editing && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setEditing(false); onDraft(""); }}>
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={!value.trim()}
              onClick={() => { onSave(value.trim()); setEditing(false); }}
            >
              Save answer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NewQuestionCard({
  q, draft, onDraft, onSubmit,
}: {
  q: NewQuestion;
  draft: string;
  onDraft: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-lg border-2 border-destructive/60 bg-destructive/[0.04] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] rounded border border-destructive/40 bg-destructive/10 text-destructive px-1.5 py-0.5">
          <Sparkles className="h-3 w-3" /> New
        </span>
        <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
          {q.section}
        </span>
        <span className="text-[11px] text-muted-foreground ml-auto">
          From {q.source} · {formatDate(q.addedAt)}
        </span>
      </div>
      <p className="text-sm text-foreground leading-snug">{q.question}</p>
      <Textarea
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        placeholder="Draft a response — this will be added to your DDQ once saved."
        className="mt-3 min-h-[80px] text-[13px]"
      />
      <div className="flex justify-end mt-2">
        <Button size="sm" className="h-7 text-[11px]" disabled={!draft.trim()} onClick={onSubmit}>
          Save & resolve
        </Button>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}