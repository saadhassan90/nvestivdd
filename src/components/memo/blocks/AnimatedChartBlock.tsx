import { createReactBlockSpec } from "@blocknote/react";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Pencil, Check, X } from "lucide-react";

/* ─── palettes (match design tokens) ─── */
const PALETTES: Record<string, string[]> = {
  mono: [
    "hsl(220 12% 18%)",
    "hsl(220 10% 38%)",
    "hsl(220 9% 55%)",
    "hsl(220 9% 70%)",
    "hsl(220 9% 82%)",
    "hsl(220 9% 90%)",
  ],
  signal: [
    "hsl(150 55% 38%)",
    "hsl(40 90% 50%)",
    "hsl(0 70% 50%)",
    "hsl(210 70% 45%)",
    "hsl(280 50% 50%)",
  ],
};

type ChartType = "bar" | "line" | "area" | "pie" | "donut";

type Datum = { label: string; value?: number; [series: string]: string | number | undefined };

interface ChartSpec {
  type: ChartType;
  title?: string;
  subtitle?: string;
  xLabel?: string;
  yLabel?: string;
  data: Datum[];
  palette?: "mono" | "signal";
}

function safeParseSpec(json: string): ChartSpec {
  try {
    const o = JSON.parse(json);
    return {
      type: (o.type || "bar") as ChartType,
      title: o.title || "",
      subtitle: o.subtitle || "",
      xLabel: o.xLabel || "",
      yLabel: o.yLabel || "",
      data: Array.isArray(o.data) ? o.data : [],
      palette: o.palette === "signal" ? "signal" : "mono",
    };
  } catch {
    return { type: "bar", data: [], palette: "mono" };
  }
}

/** Detect series keys beyond "label". */
function seriesKeys(data: Datum[]): string[] {
  const set = new Set<string>();
  for (const d of data) {
    for (const k of Object.keys(d)) {
      if (k !== "label" && typeof d[k] === "number") set.add(k);
    }
  }
  if (set.size === 0) set.add("value");
  return Array.from(set);
}

/** Read-only chart renderer (used both inside BlockNote and in chat). */
export function AnimatedChartRender({ spec, height = 280 }: { spec: ChartSpec; height?: number }) {
  const colors = PALETTES[spec.palette || "mono"];
  const keys = useMemo(() => seriesKeys(spec.data), [spec.data]);
  const empty = !spec.data || spec.data.length === 0;

  return (
    <figure className="not-prose my-3 rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {(spec.title || spec.subtitle) && (
        <figcaption className="mb-2">
          {spec.title && <div className="text-sm font-semibold text-foreground">{spec.title}</div>}
          {spec.subtitle && (
            <div className="text-[11px] text-muted-foreground mt-0.5">{spec.subtitle}</div>
          )}
        </figcaption>
      )}
      {empty ? (
        <div className="h-32 flex items-center justify-center text-[11px] text-muted-foreground">
          no data
        </div>
      ) : (
        <div style={{ width: "100%", height }}>
          <ResponsiveContainer>{renderChart(spec, keys, colors) as any}</ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

function renderChart(spec: ChartSpec, keys: string[], colors: string[]) {
  const common = {
    data: spec.data,
    margin: { top: 8, right: 12, bottom: spec.xLabel ? 24 : 8, left: spec.yLabel ? 24 : 0 },
  };
  const axisProps = {
    stroke: "hsl(220 9% 65%)",
    fontSize: 11,
    tickLine: false,
  } as const;

  if (spec.type === "pie" || spec.type === "donut") {
    const innerRadius = spec.type === "donut" ? 50 : 0;
    return (
      <PieChart>
        <Pie
          data={spec.data}
          dataKey={keys[0]}
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={innerRadius}
          isAnimationActive
          animationDuration={900}
          stroke="hsl(var(--background))"
        >
          {spec.data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    );
  }

  if (spec.type === "line") {
    return (
      <LineChart {...common}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 9% 90%)" />
        <XAxis dataKey="label" {...axisProps} label={axisLabel(spec.xLabel, "bottom")} />
        <YAxis {...axisProps} label={axisLabel(spec.yLabel, "left")} />
        <Tooltip contentStyle={tooltipStyle} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {keys.map((k, i) => (
          <Line
            key={k}
            type="monotone"
            dataKey={k}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive
            animationDuration={1100}
          />
        ))}
      </LineChart>
    );
  }

  if (spec.type === "area") {
    return (
      <AreaChart {...common}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 9% 90%)" />
        <XAxis dataKey="label" {...axisProps} label={axisLabel(spec.xLabel, "bottom")} />
        <YAxis {...axisProps} label={axisLabel(spec.yLabel, "left")} />
        <Tooltip contentStyle={tooltipStyle} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {keys.map((k, i) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive
            animationDuration={1000}
          />
        ))}
      </AreaChart>
    );
  }

  // bar (default)
  return (
    <BarChart {...common}>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 9% 90%)" vertical={false} />
      <XAxis dataKey="label" {...axisProps} label={axisLabel(spec.xLabel, "bottom")} />
      <YAxis {...axisProps} label={axisLabel(spec.yLabel, "left")} />
      <Tooltip contentStyle={tooltipStyle} />
      {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
      {keys.map((k, i) => (
        <Bar
          key={k}
          dataKey={k}
          fill={colors[i % colors.length]}
          radius={[3, 3, 0, 0]}
          isAnimationActive
          animationDuration={900}
        />
      ))}
    </BarChart>
  );
}

function axisLabel(text: string | undefined, position: "bottom" | "left") {
  if (!text) return undefined;
  return {
    value: text,
    position: position === "bottom" ? "insideBottom" : "insideLeft",
    offset: position === "bottom" ? -8 : 0,
    angle: position === "left" ? -90 : 0,
    style: { fontSize: 11, fill: "hsl(220 9% 45%)" },
  } as any;
}

const tooltipStyle = {
  fontSize: 11,
  borderRadius: 8,
  border: "1px solid hsl(220 9% 88%)",
  background: "hsl(0 0% 100%)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
} as const;

/* ─── BlockNote block spec ─── */
// createReactBlockSpec in BlockNote 0.48 returns a factory (options?) => BlockSpec.
// We immediately invoke it so consumers can drop the spec straight into the
// schema's `blockSpecs` map.
export const animatedChartBlockSpec = createReactBlockSpec(
  {
    type: "animatedChart",
    propSchema: {
      json: { default: "{}" as string },
    },
    content: "none",
  },
  {
    render: ({ block, editor }) => {
      const spec = safeParseSpec(block.props.json);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [editing, setEditing] = useState(false);
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [draft, setDraft] = useState(() => pretty(block.props.json));
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [err, setErr] = useState<string | null>(null);

      const save = () => {
        try {
          const parsed = JSON.parse(draft);
          editor.updateBlock(block, {
            type: "animatedChart",
            props: { json: JSON.stringify(parsed) },
          });
          setEditing(false);
          setErr(null);
        } catch (e: any) {
          setErr(e?.message || "Invalid JSON");
        }
      };

      return (
        <div className="w-full group relative">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
            contentEditable={false}
          >
            {editing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {editing ? "cancel" : "edit"}
          </button>
          {!editing ? (
            <AnimatedChartRender spec={spec} />
          ) : (
            <div className="not-prose my-3 rounded-xl border border-border bg-card p-3" contentEditable={false}>
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Edit chart JSON
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full h-56 font-mono text-[11px] bg-muted/40 rounded-md border border-border p-2 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                spellCheck={false}
              />
              {err && <div className="text-[11px] text-destructive mt-1">{err}</div>}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={save}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground text-background px-2.5 py-1 text-[11px] font-medium"
                >
                  <Check className="h-3 w-3" /> Save
                </button>
              </div>
            </div>
          )}
        </div>
      );
    },
    // Serialize to markdown-friendly HTML so blocksToMarkdownLossy emits a ```chart fence.
    toExternalHTML: ({ block }) => {
      const json = block.props.json || "{}";
      return (
        <pre>
          <code className="language-chart">{json}</code>
        </pre>
      );
    },
    // Parse HTML pasted in (best-effort) — markdown seeding uses postProcessChartBlocks below.
    parse: (el: HTMLElement) => {
      if (el.tagName !== "PRE") return undefined;
      const code = el.querySelector("code");
      if (!code) return undefined;
      const lang = code.className.match(/language-(\w+)/)?.[1];
      if (lang !== "chart") return undefined;
      return { json: (code.textContent || "{}").trim() };
    },
  },
)();

function pretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

/**
 * After `tryParseMarkdownToBlocks` we get a generic `codeBlock` with
 * `language: "chart"`. Walk the block tree and replace those with our
 * custom `animatedChart` block.
 */
export function postProcessChartBlocks(blocks: any[]): any[] {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((b) => {
    if (
      b?.type === "codeBlock" &&
      (b?.props?.language === "chart" || b?.props?.language === "Chart")
    ) {
      // BlockNote codeBlock content is an array of inline content; pull text.
      let text = "";
      const content = b.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (typeof c?.text === "string") text += c.text;
        }
      } else if (typeof content === "string") {
        text = content;
      }
      return {
        type: "animatedChart",
        props: { json: (text || "{}").trim() },
        children: postProcessChartBlocks(b.children || []),
      };
    }
    if (b?.children?.length) {
      return { ...b, children: postProcessChartBlocks(b.children) };
    }
    return b;
  });
}