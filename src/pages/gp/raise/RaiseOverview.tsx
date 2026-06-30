import { useParams } from "react-router-dom";
import { GpPagePlaceholder } from "@/components/gp/GpPagePlaceholder";
import { getRaise } from "@/mocks/gp/raises";
import { EditableText } from "@/components/iris/EditableText";
import { RaiseSetupChecklist } from "@/components/gp/RaiseSetupChecklist";
import { KpiRow, KpiCell } from "@/components/ui/kpi";

type FundSpecifics = {
  oneLiner: string;
  groups: { title: string; rows: { label: string; value: string }[] }[];
  sources: string[];
};

const FUND_SPECIFICS: Record<string, FundSpecifics> = {
  "fund-001": {
    oneLiner:
      "Opportunistic mid-market private credit fund targeting senior secured loans to sponsor-backed North American businesses, with selective structured equity.",
    groups: [
      {
        title: "Fund profile",
        rows: [
          { label: "Manager", value: "Meridian Capital Partners" },
          { label: "Headquarters", value: "New York, NY" },
          { label: "Fund vehicle", value: "Delaware LP + Cayman feeder" },
          { label: "Vintage", value: "2026" },
          { label: "Target / hard cap", value: "$1.2B / $1.5B" },
          { label: "First close", value: "Q3 2026 (targeted)" },
          { label: "Final close", value: "Q2 2027 (targeted)" },
        ],
      },
      {
        title: "Strategy",
        rows: [
          { label: "Asset class", value: "Private credit" },
          { label: "Sub-strategy", value: "Opportunistic / sponsor-backed direct lending" },
          { label: "Geography", value: "North America (90%) / Europe (10%)" },
          { label: "Target IRR", value: "12–14% net" },
          { label: "Target DPI", value: "1.5x net MOIC" },
          { label: "Check size", value: "$25–75M" },
          { label: "Portfolio", value: "25–35 positions" },
        ],
      },
      {
        title: "Economics & terms",
        rows: [
          { label: "Mgmt fee", value: "1.50% on invested capital" },
          { label: "Carry", value: "15% over 7% pref" },
          { label: "Waterfall", value: "European" },
          { label: "GP commit", value: "3.0%, funded in cash at first close" },
          { label: "Investment period", value: "4 years" },
          { label: "Fund term", value: "8 years + 2x1yr ext." },
          { label: "Recycling", value: "Permitted within commitment period" },
        ],
      },
      {
        title: "Team & track record",
        rows: [
          { label: "Investment professionals", value: "18 (5 partners)" },
          { label: "Avg. partner tenure", value: "11 years" },
          { label: "Prior fund (Fund II)", value: "$800M, 2022 vintage" },
          { label: "Fund II gross IRR", value: "17.4%" },
          { label: "Fund II DPI", value: "1.3x" },
          { label: "Realized loss ratio", value: "1.8% (peer median 2.4%)" },
          { label: "AUM (firmwide)", value: "$3.1B" },
        ],
      },
    ],
    sources: ["PPM_v4.pdf", "LPA_redline_v2.pdf", "Track_record_2014-2025.xlsx", "Team_bios_2026.pdf"],
  },
  "fund-002": {
    oneLiner:
      "Vertical B2B SaaS growth equity fund backing Series B–C founders building category-defining software in industrial and financial verticals.",
    groups: [
      {
        title: "Fund profile",
        rows: [
          { label: "Manager", value: "Aspen Growth Partners" },
          { label: "Headquarters", value: "San Francisco, CA" },
          { label: "Fund vehicle", value: "Delaware LP" },
          { label: "Vintage", value: "2026" },
          { label: "Target / hard cap", value: "$450M / $550M" },
          { label: "First close", value: "Q4 2026 (targeted)" },
          { label: "Final close", value: "Q3 2027 (targeted)" },
        ],
      },
      {
        title: "Strategy",
        rows: [
          { label: "Asset class", value: "Growth equity" },
          { label: "Sub-strategy", value: "Vertical B2B SaaS, Series B–C" },
          { label: "Geography", value: "North America (100%)" },
          { label: "Target IRR", value: "25%+ net" },
          { label: "Target MOIC", value: "3.0x net" },
          { label: "Check size", value: "$15–40M" },
          { label: "Portfolio", value: "12–15 positions" },
        ],
      },
      {
        title: "Economics & terms",
        rows: [
          { label: "Mgmt fee", value: "2.0% on committed (step-down post IP)" },
          { label: "Carry", value: "20% over 8% pref" },
          { label: "Waterfall", value: "American (deal-by-deal)" },
          { label: "GP commit", value: "2.0%" },
          { label: "Investment period", value: "5 years" },
          { label: "Fund term", value: "10 years + 2x1yr ext." },
          { label: "Recycling", value: "Up to 110% of commitments" },
        ],
      },
      {
        title: "Team & track record",
        rows: [
          { label: "Investment professionals", value: "7 (2 partners)" },
          { label: "Avg. partner tenure", value: "9 years (prior firms)" },
          { label: "Prior fund (Fund I)", value: "$180M, 2022 vintage" },
          { label: "Fund I TVPI", value: "1.8x (unrealized)" },
          { label: "Fund I DPI", value: "0.2x" },
          { label: "Mark-up rate", value: "55% of portfolio at >1.5x" },
          { label: "AUM (firmwide)", value: "$180M" },
        ],
      },
    ],
    sources: ["PPM_draft.pdf", "Fund_I_TVPI_summary.xlsx"],
  },
  "fund-003": {
    oneLiner:
      "Core+ digital infrastructure fund acquiring contracted hyperscaler-adjacent assets — data centers, fiber, and edge compute — across OECD markets.",
    groups: [
      {
        title: "Fund profile",
        rows: [
          { label: "Manager", value: "Northwind Infrastructure" },
          { label: "Headquarters", value: "London, UK" },
          { label: "Fund vehicle", value: "Luxembourg SCSp + parallel LP" },
          { label: "Vintage", value: "2025" },
          { label: "Target / hard cap", value: "$2.5B / $3.0B" },
          { label: "First close", value: "Q1 2025 (closed at $1.8B)" },
          { label: "Final close", value: "Q3 2026 (in progress)" },
        ],
      },
      {
        title: "Strategy",
        rows: [
          { label: "Asset class", value: "Infrastructure" },
          { label: "Sub-strategy", value: "Core+ digital infrastructure" },
          { label: "Geography", value: "North America (50%) / EMEA (40%) / APAC (10%)" },
          { label: "Target IRR", value: "10–12% net" },
          { label: "Target DPI", value: "1.7x net MOIC" },
          { label: "Check size", value: "$100–300M equity" },
          { label: "Portfolio", value: "12–18 platforms" },
        ],
      },
      {
        title: "Economics & terms",
        rows: [
          { label: "Mgmt fee", value: "1.25% on committed" },
          { label: "Carry", value: "20% over 8% pref" },
          { label: "Waterfall", value: "European" },
          { label: "GP commit", value: "5.0%" },
          { label: "Investment period", value: "5 years" },
          { label: "Fund term", value: "12 years + 2x1yr ext." },
          { label: "Recycling", value: "Permitted, capped at 115%" },
        ],
      },
      {
        title: "Team & track record",
        rows: [
          { label: "Investment professionals", value: "32 (8 partners)" },
          { label: "Avg. partner tenure", value: "14 years" },
          { label: "Prior fund (Fund II)", value: "$1.6B, 2020 vintage" },
          { label: "Fund II net IRR", value: "13.2%" },
          { label: "Fund II DPI", value: "1.9x" },
          { label: "Realized losses", value: "Zero principal losses to date" },
          { label: "AUM (firmwide)", value: "$8.4B" },
        ],
      },
    ],
    sources: ["PPM_final.pdf", "LPA_final.pdf", "Asset_level_model.xlsx", "ESG_report_2025.pdf"],
  },
};

export default function RaiseOverview() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return null;
  const specifics = FUND_SPECIFICS[raise.id];
  const stats = [
    { label: "Files in dataroom", value: raise.dataroom.length },
    { label: "DDQ items", value: raise.ddq.length },
    { label: "Unanswered DDQ", value: raise.ddq.filter((d) => d.state === "unanswered").length },
    { label: "L2 LPs engaged", value: raise.lps.length },
  ];
  return (
    <GpPagePlaceholder>
      <RaiseSetupChecklist raise={raise} />
      <KpiRow className="mt-4 lg:grid-cols-4">
        {stats.map((s) => (
          <KpiCell key={s.label} label={s.label} value={s.value} />
        ))}
      </KpiRow>
      {specifics && (
        <div className="mt-4 rounded-lg border border-border bg-card">
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Fund specifics</p>
                <span className="text-[11px] text-muted-foreground">snapshot</span>
              </div>
              <h2 className="mt-1 text-base font-semibold text-foreground truncate">{raise.name}</h2>
              <EditableText
                as="p"
                className="mt-1 text-xs text-muted-foreground leading-relaxed"
                sectionKey="fund.one_liner"
                label="Fund one-liner"
                defaultValue={specifics.oneLiner}
              />
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-muted-foreground">status</p>
              <p className="text-sm font-medium text-foreground mt-1">{raise.status}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {specifics.groups.map((g) => (
              <div key={g.title} className="p-4">
                <p className="text-[11px] text-muted-foreground mb-3">{g.title.toLowerCase()}</p>
                <dl className="space-y-1.5">
                  {g.rows.map((r) => (
                    <div key={r.label} className="flex items-baseline justify-between gap-3 text-xs">
                      <dt className="text-muted-foreground shrink-0">{r.label}</dt>
                      <dd className="text-foreground text-right tabular-nums">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] text-muted-foreground">sourced from</span>
            {specifics.sources.map((s) => (
              <span key={s} className="text-[11px] text-foreground/80 font-mono">{s}</span>
            ))}
          </div>
        </div>
      )}
    </GpPagePlaceholder>
  );
}