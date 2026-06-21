import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  RAISES,
  type ConsentState,
  type L2Lp,
  type PipelineStage,
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  dropLpFromPipeline,
  setLpStage,
  subscribeRaises,
} from "@/mocks/gp/raises";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/iris/EditableText";
import { LpRowMenu } from "@/components/gp/LpRowMenu";
import { NdaDetailDrawer } from "@/components/gp/NdaDetailDrawer";
import { SendNdaModal } from "@/components/gp/SendNdaModal";
import { getNdaByLp, seedNdasFromRaises, subscribeNdas, type NdaRecord } from "@/mocks/gp/ndas";
import { PipelineStagePill } from "@/components/gp/PipelineStagePill";

seedNdasFromRaises(RAISES);

const STAGES = PIPELINE_STAGES;
type StageId = PipelineStage;

type Row = Omit<L2Lp, "stage"> & {
  raiseId: string;
  raiseName: string;
  stage: StageId;
};

function deriveStage(raiseId: string, lp: L2Lp): StageId {
  if (lp.stage) return lp.stage;
  if (lp.consent === "withdrawn") return "declined";
  const nda = getNdaByLp(raiseId, lp.id);
  if (nda) {
    if (nda.status === "signed" || nda.status === "countersigned") {
      if (lp.questions >= 15) return "ic_ready";
      if (lp.questions >= 6) return "opened";
      return "dataroom_sent";
    }
    if (nda.status === "sent" || nda.status === "viewed") return "nda_sent";
    if (nda.status === "requested") return "requested_dataroom";
  }
  return "sent";
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

const STAGE_LABEL = PIPELINE_STAGE_LABEL;

// SVG layout constants
const VB_W = 1000;
const VB_H = 300;
const PAD_X = 70;
const PATH_Y = 170;
const BUBBLE_R = 14;
const STACK_DY = 32;
const STACK_DX = 32;
const MAX_PER_COL = 3;

function stageX(i: number): number {
  return PAD_X + (i * (VB_W - PAD_X * 2)) / (STAGES.length - 1);
}

export default function Pipeline() {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [raiseFilter, setRaiseFilter] = useState<string>("all");
  const [, force] = useState(0);
  const [openNda, setOpenNda] = useState<NdaRecord | null>(null);
  const [sendFor, setSendFor] = useState<{ raiseId: string; raiseName: string; lpId: string; lpName: string } | null>(null);
  useEffect(() => {
    const u1 = subscribeNdas(() => force((v) => v + 1));
    const u2 = subscribeRaises(() => force((v) => v + 1));
    return () => { u1(); u2(); };
  }, []);

  const allRows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const r of RAISES) {
      for (const lp of r.lps) {
        out.push({
          ...lp,
          raiseId: r.id,
          raiseName: r.name,
          stage: deriveStage(r.id, lp),
        });
      }
    }
    return out;
    // re-derive when raises or ndas change via force()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RAISES.length]);

  const rows = useMemo(
    () => (raiseFilter === "all" ? allRows : allRows.filter((r) => r.raiseId === raiseFilter)),
    [allRows, raiseFilter],
  );

  // Group active LPs by stage for bubble positioning
  const stageGroups = useMemo(() => {
    const map = new Map<StageId, Row[]>();
    STAGES.forEach((s) => map.set(s.id, []));
    for (const r of rows) {
      map.get(r.stage)?.push(r);
    }
    return map;
  }, [rows]);

  const droppedRows = rows.filter((r) => r.stage === "declined");

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
    <div className="px-6 py-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <EditableText
            as="h1"
            className="text-2xl font-semibold text-foreground"
            sectionKey="title"
            label="Page title"
            schema="text"
            defaultValue="Pipeline"
          />
          <EditableText
            as="p"
            className="text-sm text-muted-foreground mt-1.5 max-w-2xl"
            sectionKey="description"
            label="Page description"
            defaultValue="Every LP across every raise, plotted from first conversation to commitment."
          />
        </div>
        <div className="relative">
          <select
            value={raiseFilter}
            onChange={(e) => setRaiseFilter(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 pr-8 text-xs text-foreground appearance-none"
          >
            <option value="all">All raises</option>
            {RAISES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Stage graph */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-medium text-foreground">LP progression</p>
          <p className="text-[11px] text-muted-foreground">
            {rows.length - droppedRows.length} active · {droppedRows.length} dropped
          </p>
        </div>
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[900px]">
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
                  const col = Math.floor(idx / MAX_PER_COL);
                  const rowIdx = idx % MAX_PER_COL;
                  const totalCols = Math.ceil(lps.length / MAX_PER_COL);
                  const colOffset = (col - (totalCols - 1) / 2) * STACK_DX;
                  const bx = cx + colOffset;
                  const by = cy - 40 - rowIdx * STACK_DY;
                  const isHover = hoverId === `${lp.raiseId}:${lp.id}`;
                  return (
                    <g
                      key={`${lp.raiseId}-${lp.id}`}
                      transform={`translate(${bx}, ${by})`}
                      onMouseEnter={() => setHoverId(`${lp.raiseId}:${lp.id}`)}
                      onMouseLeave={() => setHoverId(null)}
                      className="cursor-pointer"
                    >
                      {rowIdx === 0 && (
                        <line
                          x1={0}
                          y1={BUBBLE_R}
                          x2={cx - bx}
                          y2={cy - by}
                          stroke="hsl(var(--border))"
                          strokeWidth={1}
                        />
                      )}
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
                            {lp.raiseName}
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.4fr_110px_110px_100px_100px_44px] text-[11px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border bg-muted/30">
          <div>LP</div>
          <div>Raise</div>
          <div>Type</div>
          <div>Stage</div>
          <div>Consent</div>
          <div>Last activity</div>
          <div className="text-center" />
        </div>
        {rows.map((lp) => (
          <div
            key={`${lp.raiseId}-${lp.id}`}
            className="grid grid-cols-[1.5fr_1.4fr_110px_110px_100px_100px_44px] items-center px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-foreground">
                {initials(lp.name)}
              </span>
              <span className="text-foreground font-medium truncate">{lp.name}</span>
            </div>
            <div className="text-xs text-muted-foreground truncate">{lp.raiseName}</div>
            <div className="text-xs text-muted-foreground">{lp.type}</div>
            <div>
              <PipelineStagePill
                stage={lp.stage}
                onChange={(next) => setLpStage(lp.raiseId, lp.id, next)}
              />
            </div>
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
            <div className="flex justify-center">
              <LpRowMenu
                raiseId={lp.raiseId}
                raiseName={lp.raiseName}
                lpId={lp.id}
                lpName={lp.name}
                onViewNda={(n) => setOpenNda(n)}
                onSendNda={() =>
                  setSendFor({ raiseId: lp.raiseId, raiseName: lp.raiseName, lpId: lp.id, lpName: lp.name })
                }
                onDropFromPipeline={() => {
                  dropLpFromPipeline(lp.raiseId, lp.id);
                  toast.error(`${lp.name} dropped from pipeline`);
                }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">No LPs yet.</div>
        )}
      </div>

      <NdaDetailDrawer nda={openNda} onClose={() => setOpenNda(null)} />
      {sendFor && (
        <SendNdaModal
          open
          onClose={() => setSendFor(null)}
          raiseId={sendFor.raiseId}
          raiseName={sendFor.raiseName}
          lpId={sendFor.lpId}
          lpName={sendFor.lpName}
        />
      )}
    </div>
  );
}