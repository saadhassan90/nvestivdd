import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Sankey, Tooltip as RTooltip, ResponsiveContainer, Layer, Rectangle } from "recharts";
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

// Main flow order (declined branches off near the end)
const MAIN_FLOW: StageId[] = [
  "sent",
  "requested_dataroom",
  "nda_sent",
  "nda_signed",
  "dataroom_sent",
  "opened",
  "ic_ready",
  "ready_to_invest",
  "current_investor",
];
const STAGE_INDEX: Record<StageId, number> = MAIN_FLOW.reduce(
  (acc, s, i) => ({ ...acc, [s]: i }),
  { declined: -1 } as Record<StageId, number>,
);

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

  // Build Sankey data — cumulative funnel: link[i→i+1] = LPs that reached at least stage i+1.
  // "declined" branches off from ic_ready.
  const sankey = useMemo(() => {
    const nodes = MAIN_FLOW.map((id) => ({
      name: PIPELINE_STAGE_LABEL[id],
      stageId: id,
    }));
    const declinedIdx = nodes.length;
    nodes.push({ name: PIPELINE_STAGE_LABEL.declined, stageId: "declined" as StageId });

    // furthest main-stage reached per LP
    const reachedCounts = new Array(MAIN_FLOW.length).fill(0);
    let declinedCount = 0;
    for (const r of rows) {
      if (r.stage === "declined") {
        declinedCount += 1;
        // assume they reached at least ic_ready before declining
        const upTo = STAGE_INDEX.ic_ready;
        for (let i = 0; i <= upTo; i++) reachedCounts[i] += 1;
      } else {
        const idx = STAGE_INDEX[r.stage];
        if (idx >= 0) for (let i = 0; i <= idx; i++) reachedCounts[i] += 1;
      }
    }

    const links: { source: number; target: number; value: number }[] = [];
    for (let i = 0; i < MAIN_FLOW.length - 1; i++) {
      // value flowing from i → i+1 = number reaching i+1
      const v = reachedCounts[i + 1];
      if (v > 0) links.push({ source: i, target: i + 1, value: v });
    }
    if (declinedCount > 0) {
      links.push({ source: STAGE_INDEX.ic_ready, target: declinedIdx, value: declinedCount });
    }
    return { nodes, links };
  }, [rows]);

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
        {sankey.links.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
            No LP flow yet.
          </div>
        ) : (
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankey}
                nodePadding={18}
                nodeWidth={12}
                linkCurvature={0.5}
                iterations={64}
                margin={{ top: 8, right: 140, bottom: 8, left: 8 }}
                node={<SankeyNode />}
                link={{ stroke: "hsl(var(--foreground))", strokeOpacity: 0.08, fill: "hsl(var(--foreground))", fillOpacity: 0.12 }}
              >
                <RTooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                  }}
                />
              </Sankey>
            </ResponsiveContainer>
          </div>
        )}
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