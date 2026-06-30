import { useState, useMemo, useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Download, Filter, Layers, ListChecks, AlertTriangle, ArrowUpRight, Gauge } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Tables } from "@/integrations/supabase/types";

interface InterrogatoryTabProps {
  items: Tables<"interrogatory_items">[];
  fundName: string;
  reportMarkdown?: string | null;
  projectId?: string;
}

type Priority = "all" | "critical" | "high" | "medium";
type Category = "all" | "team" | "track_record" | "investment_thesis" | "market_reality" | "economics" | "regulatory_ops";

// PRD v2.0 §2.1 — categories aligned to new tab taxonomy
const CATEGORIES: { key: Category; label: string; tab?: string }[] = [
  { key: "all", label: "All" },
  { key: "team", label: "Team", tab: "team" },
  { key: "track_record", label: "Track Record", tab: "track_record" },
  { key: "investment_thesis", label: "Investment Thesis", tab: "investment_thesis" },
  { key: "market_reality", label: "Macro Context", tab: "market_reality" },
  { key: "economics", label: "Economics", tab: "economics" },
  { key: "regulatory_ops", label: "Reg & Ops", tab: "regulatory_ops" },
];

function questionCategory(q: Tables<"interrogatory_items">): Category {
  const m = (q.module || q.source_module || "").toLowerCase();
  if (m.includes("team") || m.includes("manager")) return "team";
  if (m.match(/track|performance|financial/)) return "track_record";
  if (m.includes("thesis") || m.includes("strateg")) return "investment_thesis";
  if (m.includes("market") || m.includes("domain") || m.includes("competit")) return "market_reality";
  if (m.includes("fee") || m.includes("econ") || m.includes("alignment") || m.includes("term")) return "economics";
  if (m.includes("regul") || m.includes("operation") || m.includes("structur") || m.includes("compliance") || m.includes("service"))
    return "regulatory_ops";
  return "all";
}

interface AuditEntry {
  question_id: string;
  old_value: number | null;
  new_value: number;
  analyst: string;
  timestamp: string;
}

export function InterrogatoryTab({ items, projectId = "default" }: InterrogatoryTabProps) {
  const [priority, setPriority] = useState<Priority>("all");
  const [category, setCategory] = useState<Category>("all");
  const [perDimView, setPerDimView] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const auditKey = `interrogatory_audit_${projectId}`;

  // hydrate score overrides from local storage
  useEffect(() => {
    try {
      const audit = JSON.parse(localStorage.getItem(auditKey) || "[]") as AuditEntry[];
      const latest: Record<string, number> = {};
      audit.forEach((e) => {
        latest[e.question_id] = e.new_value;
      });
      setScores(latest);
    } catch {
      // ignore
    }
  }, [auditKey]);

  const writeAudit = useCallback(
    (qId: string, oldVal: number | null, newVal: number) => {
      try {
        const audit = JSON.parse(localStorage.getItem(auditKey) || "[]") as AuditEntry[];
        const entry: AuditEntry = {
          question_id: qId,
          old_value: oldVal,
          new_value: newVal,
          analyst: "current-user",
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(auditKey, JSON.stringify([...audit, entry]));
      } catch {
        // ignore
      }
    },
    [auditKey],
  );

  const updateScore = (qId: string, oldVal: number | null, newVal: number) => {
    setScores((prev) => ({ ...prev, [qId]: newVal }));
    writeAudit(qId, oldVal, newVal);
  };

  const filtered = useMemo(
    () =>
      items.filter((q) => {
        const matchesPriority = priority === "all" || q.priority === priority;
        const matchesCategory = category === "all" || questionCategory(q) === category;
        return matchesPriority && matchesCategory;
      }),
    [items, priority, category],
  );

  const counts = {
    critical: items.filter((i) => i.priority === "critical").length,
    high: items.filter((i) => i.priority === "high").length,
    medium: items.filter((i) => i.priority === "medium").length,
    total: items.length,
  };

  // Aggregate CRITICAL GP-response score (each scored 0–3, max = 3 × #critical)
  const criticalQs = items.filter((q) => q.priority === "critical");
  const criticalAggregate = criticalQs.reduce((sum, q) => sum + (scores[q.id] ?? q.gp_response_score ?? 0), 0);
  const criticalMax = criticalQs.length * 3;
  // PRD No-Meet threshold: aggregate < 18/27 → NO MEET
  const noMeetTriggered = criticalMax > 0 && criticalAggregate < 18 && criticalQs.some((q) => (scores[q.id] ?? q.gp_response_score) != null);

  const exportAuditCsv = () => {
    try {
      const audit = JSON.parse(localStorage.getItem(auditKey) || "[]") as AuditEntry[];
      const header = "question_id,old_value,new_value,analyst,timestamp\n";
      const rows = audit
        .map((e) => `${e.question_id},${e.old_value ?? ""},${e.new_value},${e.analyst},${e.timestamp}`)
        .join("\n");
      const blob = new Blob([header + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interrogatory-audit-${projectId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const groupedByDim = useMemo(() => {
    const map: Record<string, Tables<"interrogatory_items">[]> = {};
    filtered.forEach((q) => {
      const c = questionCategory(q);
      if (!map[c]) map[c] = [];
      map[c].push(q);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Question Count Strip + Aggregate Critical Score */}
      <BlurFade>
        <SectionCard
          title="Question Counts"
          subtitle="By priority — aggregate CRITICAL score gates No-Meet conversion"
          icon={<Layers className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiTile label="Critical" value={counts.critical} tone="bad" />
            <KpiTile label="High" value={counts.high} tone="warn" />
            <KpiTile label="Medium" value={counts.medium} />
            <KpiTile label="Total" value={counts.total} />
            <KpiTile
              label="Critical Score"
              value={criticalMax > 0 ? `${criticalAggregate}/${criticalMax}` : null}
              subValue={criticalMax > 0 ? `Threshold: 18/${criticalMax}` : "No critical qs"}
              tone={noMeetTriggered ? "bad" : criticalAggregate >= 18 ? "good" : "neutral"}
              icon={<Gauge className="h-3 w-3" />}
            />
          </div>
        </SectionCard>
      </BlurFade>

      {/* Filter Toolbar */}
      <BlurFade delay={0.04}>
        <SectionCard
          title="Filters"
          subtitle="Priority + category chips"
          icon={<Filter className="h-4 w-4" />}
          actions={
            <>
              <button
                onClick={() => setPerDimView((v) => !v)}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1"
              >
                {perDimView ? "Flat View" : "Per-Dimension"}
              </button>
              <button
                onClick={exportAuditCsv}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1 inline-flex items-center gap-1"
              >
                <Download className="h-3 w-3" /> CSV
              </button>
            </>
          }
        >
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "critical", "high", "medium"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    priority === p ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    category === c.key ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* No-Meet Conversion Banner — live state */}
      <BlurFade delay={0.05}>
        <div
          className={`rounded-lg border px-3 py-2 flex items-start gap-2 ${
            noMeetTriggered
              ? "border-severity-critical/40 bg-severity-critical/10"
              : "border-severity-elevated/30 bg-severity-elevated/5"
          }`}
        >
          <AlertTriangle
            className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
              noMeetTriggered ? "text-severity-critical" : "text-severity-elevated"
            }`}
          />
          <p className={`text-[11px] ${noMeetTriggered ? "text-severity-critical" : "text-severity-elevated/90"}`}>
            <span className="font-bold">No-Meet Threshold:</span>{" "}
            {noMeetTriggered
              ? `TRIGGERED — aggregate critical score ${criticalAggregate}/${criticalMax} below 18 floor. Convert to NO MEET.`
              : `Aggregate CRITICAL score below 18/${criticalMax || 27} → convert to NO MEET. Current: ${criticalAggregate}/${criticalMax || 27}.`}
          </p>
        </div>
      </BlurFade>

      {/* Questions Table or Per-Dim */}
      <BlurFade delay={0.08}>
        <SectionCard
          title={perDimView ? "Questions — Per-Dimension View" : "Questions Table"}
          subtitle="Editable 0–3 GP Response Score · audit log persisted"
          icon={<ListChecks className="h-4 w-4" />}
          empty={filtered.length === 0}
          emptyMessage="No questions match the current filters."
        >
          {filtered.length > 0 && !perDimView && (
            <QuestionsTable items={filtered} scores={scores} updateScore={updateScore} projectId={projectId} />
          )}
          {filtered.length > 0 && perDimView && (
            <div className="space-y-3">
              {Object.entries(groupedByDim).map(([dim, qs]) => (
                <Collapsible key={dim} defaultOpen>
                  <CollapsibleTrigger className="w-full text-left text-xs font-bold text-foreground py-1">
                    {CATEGORIES.find((c) => c.key === dim)?.label || dim} ({qs.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <QuestionsTable items={qs} scores={scores} updateScore={updateScore} projectId={projectId} />
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </SectionCard>
      </BlurFade>

      {/* Scoring Guidance Footer */}
      <BlurFade delay={0.1}>
        <SectionCard title="Scoring Guidance" subtitle="GP response scale" icon={<ListChecks className="h-4 w-4" />}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-foreground/85">
            <li><b>0</b> — not addressed / evasive</li>
            <li><b>1</b> — partially addressed, follow-up required</li>
            <li><b>2</b> — substantively addressed with documentation</li>
            <li><b>3</b> — fully documented with independent verification</li>
          </ul>
        </SectionCard>
      </BlurFade>
    </div>
  );
}

function QuestionsTable({
  items,
  scores,
  updateScore,
  projectId,
}: {
  items: Tables<"interrogatory_items">[];
  scores: Record<string, number>;
  updateScore: (qId: string, oldVal: number | null, newVal: number) => void;
  projectId: string;
}) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs min-w-[700px]">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">#</th>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">Question</th>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">Rationale</th>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">Priority</th>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">Origin</th>
            <th className="text-left px-3 py-2 font-semibold text-[10px] text-muted-foreground">Score</th>
          </tr>
        </thead>
        <tbody>
          {items.map((q) => {
            const baseline = q.gp_response_score ?? null;
            const current = scores[q.id] ?? baseline ?? 0;
            const modified = scores[q.id] !== undefined && scores[q.id] !== baseline;
            const cat = questionCategory(q);
            const tab = CATEGORIES.find((c) => c.key === cat)?.tab;
            return (
              <tr key={q.id} className="border-b border-border/40 align-top">
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground whitespace-nowrap">{q.question_id || "—"}</td>
                <td className="px-3 py-2 text-foreground">{q.question}</td>
                <td className="px-3 py-2 text-muted-foreground italic">{q.rationale || "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      q.priority === "critical"
                        ? "bg-severity-critical/15 text-severity-critical"
                        : q.priority === "high"
                          ? "bg-severity-elevated/15 text-severity-elevated"
                          : "bg-muted text-foreground"
                    }`}
                  >
                    {q.priority}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {tab ? (
                    <RouterLink
                      to={`/project/${projectId}?tab=${tab}`}
                      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {CATEGORIES.find((c) => c.key === cat)?.label}
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </RouterLink>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={current}
                      onChange={(e) => updateScore(q.id, baseline, Number(e.target.value))}
                      className="border border-border bg-card rounded px-1.5 py-0.5 text-xs"
                    >
                      {[0, 1, 2, 3].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {modified && <span className="h-1.5 w-1.5 rounded-full bg-severity-elevated" title="Modified from baseline" />}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
