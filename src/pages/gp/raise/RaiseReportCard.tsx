import { useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, Layers, ShieldCheck } from "lucide-react";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise, overallCompletion, type Raise, type ReportSection } from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

type Level = "L1" | "L2" | "L3";

const LEVELS: { id: Level; label: string; sub: string; icon: typeof Eye }[] = [
  { id: "L1", label: "L1 — Pre-Dataroom", sub: "What every LP sees before NDA — mirror of the LP view", icon: Eye },
  { id: "L2", label: "L2 — IDD", sub: "Investment due diligence — thesis, market, team, track, economics", icon: Layers },
  { id: "L3", label: "L3 — ODD", sub: "Operational due diligence — firm, governance, controls, compliance", icon: ShieldCheck },
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

      {level === "L1" && (
        <L1PreDataroom
          raise={raise}
          composite={composite}
          completeness={completeness}
          verdict={verdict}
        />
      )}
      {level === "L2" && <L2Idd report={raise.report} />}
      {level === "L3" && <L3Odd />}
    </GpPagePlaceholder>
  );
}

function L1PreDataroom({
  raise: r,
  composite,
  completeness,
  verdict,
}: {
  raise: Raise;
  composite: number;
  completeness: number;
  verdict: { label: string; tone: string };
}) {
  const overall = overallCompletion(r);
  const stats = [
    { label: "Vintage", value: r.vintage },
    { label: "Target size", value: r.targetSize },
    { label: "Strategy", value: r.strategy },
    { label: "Status", value: r.status },
  ];
  return (
    <div className="space-y-4">
      {/* Fund identity + verdict */}
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
          {r.name} screens as a {verdict.label.toLowerCase()} based on the current evidence base. Five dimensions are
          weighted Thesis 15 / Market 20 / Team 25 / Track 20 / Economics 20, renormalised when data is insufficient.
        </p>
      </div>

      {/* Fund snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Raise completion */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">Raise completion</p>
          <p className="text-lg font-semibold text-foreground tabular-nums">{overall}%</p>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-foreground" style={{ width: `${overall}%` }} />
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Dataroom", pct: r.completion.dataroom },
            { name: "IRIS Report", pct: r.completion.report },
            { name: "DDQ", pct: r.completion.ddq },
            { name: "IRIS Interview", pct: r.completion.interview },
          ].map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.name}</span>
                <span className="tabular-nums">{c.pct}%</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-foreground/60" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        {r.report.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-card px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className="text-[11px] text-muted-foreground">synth {d.lastSynth}</span>
                <span className="text-lg font-semibold text-foreground tabular-nums">{d.score}</span>
              </div>
            </div>
            <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className={"h-full " + scoreColor(d.score)} style={{ width: `${d.score}%` }} />
            </div>
            <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{d.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function L2Idd({ report }: { report: ReportSection[] }) {
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

function L3Odd() {
  const sections = [
    {
      title: "Firm & ownership",
      score: 86,
      summary: "100% employee-owned since 2019 spinout. No external GP stakes. Stable cap table across three funds.",
      items: ["Ownership chart current", "No related-party transactions disclosed", "Annual independent audit (Big Four)"],
    },
    {
      title: "Governance & controls",
      score: 82,
      summary: "Independent valuation committee meets quarterly. Segregation of duties between investment and finance functions.",
      items: ["Valuation policy v3 in data room", "SOC 1 Type II issued Apr-2026", "Four-eyes wire approval"],
    },
    {
      title: "Compliance & regulatory",
      score: 78,
      summary: "SEC-registered RIA since 2014. No material findings on the last two exams. AIFMD marketing passport in place for EU LPs.",
      items: ["CCO is full-time, non-investment", "Annual compliance review filed", "No open enforcement matters"],
    },
    {
      title: "Operations & service providers",
      score: 84,
      summary: "Tier-1 fund administrator, custodian, and audit firm. BCP tested annually with documented recovery times.",
      items: ["Admin: SS&C", "Custody: State Street", "Audit: PwC", "BCP RTO < 4h"],
    },
    {
      title: "Cybersecurity & data",
      score: 72,
      summary: "ISO 27001 certified. MFA enforced firm-wide. Penetration test conducted semi-annually by an independent third party.",
      items: ["Last pen test: Mar-2026 — no critical findings", "Vendor risk reviews annual", "Data residency: US + EU"],
    },
    {
      title: "ESG & reporting",
      score: 68,
      summary: "SFDR Article 8 fund. Annual ESG report aligned with ILPA template. PRI signatory since 2018.",
      items: ["ILPA reporting quarterly", "PRI assessment: A", "Climate disclosures: TCFD-aligned"],
    },
  ];
  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <div key={s.title} className="rounded-lg border border-border bg-card px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
            <span className="text-lg font-semibold text-foreground tabular-nums">{s.score}</span>
          </div>
          <div className="mt-2 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div className={"h-full " + scoreColor(s.score)} style={{ width: `${s.score}%` }} />
          </div>
          <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{s.summary}</p>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-foreground">
            {s.items.map((it) => (
              <li key={it} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}