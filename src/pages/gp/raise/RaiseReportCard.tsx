import { useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, FileText, Layers, Database, Sparkles } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise, type ReportSection } from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

type Level = "L1" | "L2" | "L3" | "L4";

const LEVELS: { id: Level; label: string; sub: string; icon: typeof Eye }[] = [
  { id: "L1", label: "L1 — Snapshot", sub: "What every LP sees first", icon: Eye },
  { id: "L2", label: "L2 — Diligence", sub: "Dimension deep-dives", icon: Layers },
  { id: "L3", label: "L3 — IC Memo", sub: "Long-form analyst view", icon: FileText },
  { id: "L4", label: "L4 — Sources", sub: "Evidence & data room", icon: Database },
];

function scoreColor(s: number) {
  if (s >= 85) return "bg-foreground";
  if (s >= 70) return "bg-foreground/70";
  if (s >= 55) return "bg-foreground/50";
  return "bg-destructive/60";
}

function verdictFor(composite: number, completeness: number): { label: string; tone: string } {
  if (completeness < 30) return { label: "Defer — insufficient data", tone: "text-muted-foreground border-border" };
  if (composite >= 80) return { label: "Advance", tone: "text-foreground border-foreground/40" };
  if (composite >= 68) return { label: "Conditional Advance", tone: "text-foreground border-foreground/30" };
  if (composite >= 55) return { label: "Defer", tone: "text-muted-foreground border-border" };
  return { label: "Decline", tone: "text-destructive border-destructive/40" };
}

export default function RaiseReportCard() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  const [level, setLevel] = useState<Level>("L1");
  if (!raise) return null;

  const composite = raise.report.length
    ? Math.round(raise.report.reduce((a, r) => a + r.score, 0) / raise.report.length)
    : 0;
  const completeness = Math.round(
    (raise.completion.dataroom + raise.completion.report + raise.completion.ddq + raise.completion.interview) / 4
  );
  const verdict = verdictFor(composite, completeness);

  return (
    <GpPagePlaceholder>
      {/* Mirror banner */}
      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5" />
        <span>Mirror of the LP-facing report. Switch tiers to see what each LP audience reads.</span>
      </div>

      {/* Level switcher */}
      <div className="flex gap-1 border-b border-border mb-5">
        {LEVELS.map((l) => {
          const Icon = l.icon;
          const active = level === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground -mt-3 mb-5">{LEVELS.find((l) => l.id === level)?.sub}</p>

      {level === "L1" && <L1Snapshot raiseName={raise.name} composite={composite} completeness={completeness} verdict={verdict} report={raise.report} />}
      {level === "L2" && <L2Diligence report={raise.report} />}
      {level === "L3" && <L3Memo raiseName={raise.name} composite={composite} verdict={verdict.label} report={raise.report} />}
      {level === "L4" && <L4Sources raiseId={raise.id} />}
    </GpPagePlaceholder>
  );
}

function L1Snapshot({
  raiseName,
  composite,
  completeness,
  verdict,
  report,
}: {
  raiseName: string;
  composite: number;
  completeness: number;
  verdict: { label: string; tone: string };
  report: ReportSection[];
}) {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Composite</p>
            <p className="mt-1 text-4xl font-semibold text-foreground tabular-nums">{composite}</p>
            <div className="mt-2 h-2 w-48 rounded-full bg-muted overflow-hidden">
              <div className={"h-full " + scoreColor(composite)} style={{ width: `${composite}%` }} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={cn("text-xs px-2 py-1 rounded-md border", verdict.tone)}>{verdict.label}</span>
            <span className="text-[11px] text-muted-foreground">Completeness {completeness}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          {raiseName} screens as a {verdict.label.toLowerCase()} based on the current evidence base. Five dimensions are
          weighted Thesis 15 / Market 20 / Team 25 / Track 20 / Economics 20, renormalised when data is insufficient.
        </p>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        {report.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-[11px] text-muted-foreground">synth {r.lastSynth}</span>
                <span className="text-lg font-semibold text-foreground tabular-nums">{r.score}</span>
              </div>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className={"h-full " + scoreColor(r.score)} style={{ width: `${r.score}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{r.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function L2Diligence({ report }: { report: ReportSection[] }) {
  return (
    <div className="space-y-3">
      {report.map((r) => (
        <details key={r.id} className="group rounded-lg border border-border bg-card open:shadow-sm">
          <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-sm font-semibold text-foreground">{r.title}</span>
              <span className="text-[11px] text-muted-foreground truncate">{r.summary.split(";")[0]}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                <div className={"h-full " + scoreColor(r.score)} style={{ width: `${r.score}%` }} />
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums w-8 text-right">{r.score}</span>
            </div>
          </summary>
          <div className="px-5 pb-5 pt-1 border-t border-border">
            <p className="text-sm text-foreground leading-relaxed">{r.summary}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Strengths</p>
                <ul className="text-xs text-foreground space-y-1 list-disc list-inside marker:text-muted-foreground">
                  <li>Consistent execution evidenced across prior funds.</li>
                  <li>Aligned incentive structure with GP commit.</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Watch items</p>
                <ul className="text-xs text-foreground space-y-1 list-disc list-inside marker:text-muted-foreground">
                  <li>Concentration risk in 2022 vintage deals.</li>
                  <li>Bench depth at the principal level.</li>
                </ul>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Last synthesis {r.lastSynth} · 4 citations · 2 open questions</p>
          </div>
        </details>
      ))}
    </div>
  );
}

function L3Memo({
  raiseName,
  composite,
  verdict,
  report,
}: {
  raiseName: string;
  composite: number;
  verdict: string;
  report: ReportSection[];
}) {
  return (
    <article className="rounded-lg border border-border bg-card px-7 py-6 space-y-5">
      <header className="border-b border-border pb-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">IC Memo · Draft</p>
        <h1 className="text-xl font-semibold text-foreground mt-1">{raiseName}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Composite {composite} · Recommendation: {verdict}
        </p>
      </header>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" /> Executive summary
        </h2>
        <p className="text-sm text-foreground leading-relaxed">
          The opportunity is anchored in a differentiated sourcing model and a senior team with multi-cycle continuity.
          Underwriting discipline is broadly evidenced; the principal areas of further diligence concentrate on loss
          attribution and economic alignment at the upper end of the strategy.
        </p>
      </section>
      {report.map((r) => (
        <section key={r.id} className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{r.title}</h2>
          <p className="text-sm text-foreground leading-relaxed">{r.summary}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Supporting analysis draws on data room evidence, references, and prior fund tear-sheets. Synthesis last
            refreshed {r.lastSynth}.
          </p>
        </section>
      ))}
      <footer className="text-[11px] text-muted-foreground pt-2 border-t border-border">
        Draft generated by Iris. Edit in the IC Memo workspace before circulating to the committee.
      </footer>
    </article>
  );
}

function L4Sources({ raiseId }: { raiseId: string }) {
  const raise = getRaise(raiseId);
  if (!raise) return null;
  const tiers = [
    { tier: "Primary", desc: "Direct from the GP — verified", items: raise.dataroom.slice(0, 3) },
    { tier: "Supporting", desc: "Cross-referenced filings & tear-sheets", items: raise.dataroom.slice(3) },
    { tier: "Inferred", desc: "Model-generated synthesis, citation-linked", items: [] as typeof raise.dataroom },
  ];
  return (
    <div className="space-y-5">
      {tiers.map((t) => (
        <div key={t.tier}>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">{t.tier}</h3>
            <span className="text-[11px] text-muted-foreground">{t.desc}</span>
          </div>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {t.items.length === 0 && (
              <div className="px-4 py-6 text-xs text-muted-foreground text-center">No sources in this tier yet.</div>
            )}
            {t.items.map((f) => (
              <div key={f.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{f.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1 py-0.5 shrink-0">
                    v{f.version}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{f.category}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}