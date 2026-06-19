import { useMemo, useState } from "react";
import { RAISES, type ConsentState, type L2Lp } from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "sourced", label: "Sourced" },
  { id: "nda", label: "NDA" },
  { id: "dataroom", label: "Data Room" },
  { id: "ddq", label: "DDQ" },
  { id: "ic", label: "IC Review" },
  { id: "commit", label: "Commitment" },
  { id: "closed", label: "Closed" },
] as const;
type StageId = (typeof STAGES)[number]["id"];

type Row = L2Lp & {
  raiseId: string;
  raiseName: string;
  stage: StageId | "dropped";
  commitment: string;
};

const COMMIT_BY_TYPE: Record<L2Lp["type"], number> = {
  SWF: 150,
  Pension: 75,
  Insurance: 60,
  Endowment: 40,
  "Family Office": 20,
};

function deriveStage(lp: L2Lp): StageId | "dropped" {
  if (lp.consent === "withdrawn") return "dropped";
  if (lp.consent === "pending") return "nda";
  if (lp.questions === 0) return "dataroom";
  if (lp.questions <= 5) return "ddq";
  if (lp.questions <= 10) return "ic";
  if (lp.questions <= 20) return "commit";
  return "closed";
}

function deriveCommitment(lp: L2Lp): string {
  const base = COMMIT_BY_TYPE[lp.type];
  const jitter = ((lp.id.charCodeAt(lp.id.length - 1) % 7) - 3) * 5;
  return `$${Math.max(10, base + jitter)}M`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const CONSENT_STYLES: Record<ConsentState, string> = {
  shared: "border-foreground/30 text-foreground bg-muted/40",
  pending: "border-border text-muted-foreground",
  withdrawn: "border-destructive/40 text-destructive",
};

const STAGE_LABEL: Record<StageId | "dropped", string> = {
  sourced: "Sourced",
  nda: "NDA",
  dataroom: "Data Room",
  ddq: "DDQ",
  ic: "IC Review",
  commit: "Commitment",
  closed: "Closed",
  dropped: "Dropped",
};

// SVG layout constants
const VB_W = 1000;
const VB_H = 280;
const PAD_X = 70;
const PATH_Y = 170;
const BUBBLE_R = 16;
const STACK_DY = 36;

function stageX(i: number): number {
  return PAD_X + (i * (VB_W - PAD_X * 2)) / (STAGES.length - 1);
}

export default function Pipeline() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [raiseFilter, setRaiseFilter] = useState<string>("all");

  const allRows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const r of RAISES) {
      for (const lp of r.lps) {
        out.push({
          ...lp,
          raiseId: r.id,
          raiseName: r.name,
          stage: deriveStage(lp),
          commitment: deriveCommitment(lp),
        });
      }
    }
    return out;
  }, []);

  const rows = useMemo(
    () => (raiseFilter === "all" ? allRows : allRows.filter((r) => r.raiseId === raiseFilter)),
    [allRows, raiseFilter],
  );

  // Group active LPs by stage for bubble positioning
  const stageGroups = useMemo(() => {
    const map = new Map<StageId, Row[]>();
    STAGES.forEach((s) => map.set(s.id, []));
    for (const r of rows) {
      if (r.stage === "dropped") continue;
      map.get(r.stage as StageId)?.push(r);
    }
    return map;
  }, [rows]);

  const droppedRows = rows.filter((r) => r.stage === "dropped");

  // Build the path: a gentle wave so it doesn't feel like a ruler
  const pathD = useMemo(() => {
    const x0 = PAD_X;
    const xN = VB_W - PAD_X;
    return `M ${x0} ${PATH_Y} C ${x0 + 180} ${PATH_Y - 50}, ${xN - 180} ${PATH_Y + 50}, ${xN} ${PATH_Y}`;
  }, []);

  // y position on the path at stage index (approximate to match curve)
  function stageY(i: number): number {
    const t = i / (STAGES.length - 1);
    // approximate cubic bezier y for the wave above
    const y0 = PATH_Y,
      y1 = PATH_Y - 50,
      y2 = PATH_Y + 50,
      y3 = PATH_Y;
    const mt = 1 - t;
    return mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
            Every LP across every raise, plotted from first conversation to commitment.
          </p>
        </div>
        <select
          value={raiseFilter}
          onChange={(e) => setRaiseFilter(e.target.value)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
        >
          <option value="all">All raises</option>
          {RAISES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stage graph */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-medium text-foreground">LP progression</p>
          <p className="text-[11px] text-muted-foreground">
            {rows.length - droppedRows.length} active · {droppedRows.length} dropped
          </p>
        </div>
        <div className="relative w-full">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto">
            {/* Path */}
            <path
              d={pathD}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              strokeDasharray="4 6"
            />
            {/* Finish line marker */}
            <line
              x1={VB_W - PAD_X}
              x2={VB_W - PAD_X}
              y1={PATH_Y - 70}
              y2={PATH_Y + 70}
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
            />
            {/* Stage tick markers + labels */}
            {STAGES.map((s, i) => {
              const x = stageX(i);
              const y = stageY(i);
              return (
                <g key={s.id}>
                  <circle cx={x} cy={y} r={4} fill="hsl(var(--foreground))" />
                  <text
                    x={x}
                    y={VB_H - 20}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={11}
                  >
                    {s.label}
                  </text>
                  <text
                    x={x}
                    y={VB_H - 6}
                    textAnchor="middle"
                    className="fill-foreground"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {stageGroups.get(s.id)?.length ?? 0}
                  </text>
                </g>
              );
            })}
            {/* Bubbles */}
            {STAGES.map((s, i) => {
              const lps = stageGroups.get(s.id) ?? [];
              const cx = stageX(i);
              const cy = stageY(i);
              return lps.map((lp, idx) => {
                const offset = (idx - (lps.length - 1) / 2) * STACK_DY;
                const by = cy - 36 + offset; // sit above the path point
                const isHover = hoverId === `${lp.raiseId}:${lp.id}`;
                return (
                  <g
                    key={`${lp.raiseId}-${lp.id}`}
                    transform={`translate(${cx}, ${by})`}
                    onMouseEnter={() => setHoverId(`${lp.raiseId}:${lp.id}`)}
                    onMouseLeave={() => setHoverId(null)}
                    className="cursor-pointer"
                  >
                    <line
                      x1={0}
                      y1={BUBBLE_R}
                      x2={0}
                      y2={cy - by}
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                    <circle
                      r={BUBBLE_R}
                      fill="hsl(var(--background))"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={isHover ? 2 : 1.25}
                    />
                    <text
                      textAnchor="middle"
                      dy={4}
                      fontSize={10}
                      fontWeight={600}
                      className="fill-foreground select-none"
                    >
                      {initials(lp.name)}
                    </text>
                    {isHover && (
                      <g transform={`translate(0, ${-BUBBLE_R - 8})`}>
                        <rect
                          x={-90}
                          y={-32}
                          width={180}
                          height={32}
                          rx={4}
                          fill="hsl(var(--popover))"
                          stroke="hsl(var(--border))"
                        />
                        <text
                          x={0}
                          y={-19}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={600}
                          className="fill-foreground"
                        >
                          {lp.name}
                        </text>
                        <text
                          x={0}
                          y={-6}
                          textAnchor="middle"
                          fontSize={9}
                          className="fill-muted-foreground"
                        >
                          {lp.raiseName} · {lp.commitment}
                        </text>
                      </g>
                    )}
                  </g>
                );
              });
            })}
            {/* Finish line label */}
            <text
              x={VB_W - PAD_X}
              y={PATH_Y - 80}
              textAnchor="middle"
              fontSize={10}
              className="fill-muted-foreground uppercase tracking-wider"
            >
              Finish
            </text>
          </svg>

          {droppedRows.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Dropped
              </span>
              {droppedRows.map((lp) => (
                <span
                  key={`${lp.raiseId}-${lp.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 px-2 py-0.5 text-[11px] text-destructive"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-destructive/40 text-[8px] font-semibold">
                    {initials(lp.name)}
                  </span>
                  {lp.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.4fr_110px_110px_100px_100px_110px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
          <div>LP</div>
          <div>Raise</div>
          <div>Type</div>
          <div>Stage</div>
          <div>Commitment</div>
          <div>Consent</div>
          <div>Last activity</div>
        </div>
        {rows.map((lp) => (
          <div
            key={`${lp.raiseId}-${lp.id}`}
            className="grid grid-cols-[1.5fr_1.4fr_110px_110px_100px_100px_110px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-foreground">
                {initials(lp.name)}
              </span>
              <span className="text-foreground font-medium truncate">{lp.name}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{lp.raiseName}</div>
            <div className="text-xs text-muted-foreground">{lp.type}</div>
            <div className="text-xs text-foreground">{STAGE_LABEL[lp.stage]}</div>
            <div className="text-xs text-foreground tabular-nums">{lp.commitment}</div>
            <div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider border rounded px-1.5 py-0.5",
                  CONSENT_STYLES[lp.consent],
                )}
              >
                {lp.consent}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{lp.lastActivity}</div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No LPs yet.</div>
        )}
      </div>
    </div>
  );
}