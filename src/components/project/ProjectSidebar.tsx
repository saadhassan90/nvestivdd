import { LayoutDashboard, Lightbulb, Globe2, Users, TrendingUp, DollarSign, Shield, AlertTriangle, MessageSquare, FileText, FileBarChart, FolderOpen } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { getSectionTier, SCORE_TIER_LABELS, type ScoreTier } from "@/lib/score-utils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
  moduleScoresData?: any[];
  redFlagsCount?: number;
  regOpsStatus?: "pass" | "conditional" | "fail" | null;
  collapsed?: boolean;
}

type NavItem = {
  key: string;
  label: string;
  icon: any;
  /** Score lookup key matched against module_scores.module_key / module_label. */
  scoreKey?: string;
  /** Special right-side render variant. */
  variant?: "score" | "regops" | "flags" | "none";
};

// PRD v2.0 §2.1 — 12-row sidebar
const L1_NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, variant: "none" },
  { key: "investment_thesis", label: "Investment Thesis", icon: Lightbulb, scoreKey: "thesis", variant: "score" },
  { key: "market_reality", label: "Market Reality", icon: Globe2, scoreKey: "market", variant: "score" },
  { key: "team", label: "Team & Manager", icon: Users, scoreKey: "team", variant: "score" },
  { key: "track_record", label: "Track Record", icon: TrendingUp, scoreKey: "performance", variant: "score" },
  { key: "economics", label: "Economics", icon: DollarSign, scoreKey: "terms", variant: "score" },
  { key: "regulatory_ops", label: "Regulatory & Ops", icon: Shield, variant: "regops" },
  { key: "red_flags", label: "Risk Flags", icon: AlertTriangle, variant: "flags" },
  { key: "interrogatory", label: "Diligence Questions", icon: MessageSquare, variant: "none" },
  // divider rendered between row 9 and row 10
  { key: "documents", label: "Sources", icon: FileText, variant: "none" },
  { key: "analysis_log", label: "Analysis Log", icon: FileBarChart, variant: "none" },
  { key: "data_room", label: "Dataroom", icon: FolderOpen, variant: "none" },
];

const PROCESSING_NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, variant: "none" },
  { key: "analysis_log", label: "Analysis Log", icon: FileBarChart, variant: "none" },
];

// Map module_scores rows to the section scoreKey via fuzzy matching.
function findScore(modules: any[] | undefined, scoreKey: string): number | null {
  if (!modules?.length) return null;
  const needle = scoreKey.toLowerCase();
  const aliases: Record<string, string[]> = {
    thesis: ["investment_thesis", "thesis", "strategy", "module_c"],
    market: ["market_reality", "market", "domain", "module_d"],
    team: ["team", "module_b", "manager"],
    performance: ["track_record", "performance", "track", "financial", "module_a"],
    terms: ["economics", "terms", "fee", "module_d_terms"],
  };
  const keys = aliases[needle] || [needle];
  const m = modules.find((row) =>
    keys.some((k) =>
      row.module_key?.toLowerCase().includes(k) ||
      row.module_label?.toLowerCase().includes(k)
    )
  );
  if (!m) return null;
  const raw = m.score ?? m.numeric_score ?? m.score_numeric ?? null;
  if (raw == null) return null;
  // Normalize to 1–10 scale; if value > 10 assume 1–100.
  return raw > 10 ? Math.round((raw / 10) * 10) / 10 : raw;
}

function tierShortLabel(tier: ScoreTier): string {
  switch (tier) {
    case "exceptional": return "Exc";
    case "strong": return "Str";
    case "adequate": return "Adq";
    case "below_average": return "BA";
    case "concerning": return "Con";
    case "insufficient_data": return "N/A";
  }
}

function tierClass(tier: ScoreTier): string {
  switch (tier) {
    case "exceptional":
    case "strong": return "text-score-strong border-score-strong/30";
    case "adequate": return "text-score-advance border-score-advance/30";
    case "below_average": return "text-score-review border-score-review/30";
    case "concerning": return "text-severity-critical border-severity-critical/30";
    case "insufficient_data": return "text-muted-foreground border-border";
  }
}

function ScoreChip({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="ml-auto text-[10px] font-medium text-muted-foreground tabular-nums">
        ─ N/A
      </span>
    );
  }
  const tier = getSectionTier(score);
  return (
    <span
      className={cn(
        "ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-[1px] text-[10px] font-semibold tabular-nums",
        tierClass(tier)
      )}
      title={SCORE_TIER_LABELS[tier]}
    >
      <span>{score.toFixed(1)}</span>
      <span className="opacity-70">{tierShortLabel(tier)}</span>
    </span>
  );
}

function RegOpsChip({ status }: { status: "pass" | "conditional" | "fail" | null }) {
  if (!status) {
    return <span className="ml-auto text-[10px] text-muted-foreground">─</span>;
  }
  const map = {
    pass: { label: "Pass", cls: "text-score-strong border-score-strong/30" },
    conditional: { label: "Cond", cls: "text-score-review border-score-review/30" },
    fail: { label: "Fail", cls: "text-severity-critical border-severity-critical/30" },
  } as const;
  const v = map[status];
  return (
    <span className={cn("ml-auto inline-flex items-center rounded border px-1.5 py-[1px] text-[10px] font-semibold", v.cls)}>
      {v.label}
    </span>
  );
}

function FlagsChip({ count }: { count: number }) {
  if (count <= 0) {
    return <span className="ml-auto text-[10px] text-muted-foreground">0</span>;
  }
  return (
    <span className="ml-auto inline-flex items-center gap-0.5 rounded border border-severity-critical/30 px-1.5 py-[1px] text-[10px] font-semibold text-severity-critical">
      <AlertTriangle className="h-2.5 w-2.5" />
      {count}
    </span>
  );
}

export function ProjectSidebar({ project, activeTab, onTabChange, moduleScoresData, redFlagsCount = 0, regOpsStatus = null, collapsed = false }: ProjectSidebarProps) {
  const isProcessing = ["pending", "uploading", "processing", "analyzing", "extracting"].includes(project.status);
  const navItems = isProcessing ? PROCESSING_NAV_ITEMS : L1_NAV_ITEMS;

  const renderRightChip = (item: NavItem) => {
    if (item.variant === "score" && item.scoreKey) {
      return <ScoreChip score={findScore(moduleScoresData, item.scoreKey)} />;
    }
    if (item.variant === "regops") return <RegOpsChip status={regOpsStatus} />;
    if (item.variant === "flags") return <FlagsChip count={redFlagsCount} />;
    return null;
  };

  const getTooltipMeta = (item: NavItem): string | null => {
    if (item.variant === "score" && item.scoreKey) {
      const s = findScore(moduleScoresData, item.scoreKey);
      if (s == null) return "N/A";
      return `${s.toFixed(1)} · ${tierShortLabel(getSectionTier(s))}`;
    }
    if (item.variant === "regops") {
      if (!regOpsStatus) return null;
      return regOpsStatus === "pass" ? "Pass" : regOpsStatus === "conditional" ? "Conditional" : "Fail";
    }
    if (item.variant === "flags") return redFlagsCount > 0 ? `${redFlagsCount} flag${redFlagsCount === 1 ? "" : "s"}` : null;
    return null;
  };

  return (
    <>
      {/* Mobile pills */}
      <div className="lg:hidden bg-background overflow-x-auto">
        <div className="flex px-4 py-2 gap-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 bg-background flex-col h-full transition-[width] duration-200 ease-out overflow-hidden",
          collapsed ? "w-14" : "w-56"
        )}
      >
        <div className={cn("pb-3", collapsed ? "p-2" : "p-4")}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">N</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate">{project.fund_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{project.gp_entity_name || "Due Diligence"}</p>
              </div>
            )}
          </div>
        </div>

        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <nav className={cn("flex-1 overflow-y-auto pt-2 space-y-0.5", collapsed ? "p-1.5" : "p-3")}>
            {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            // PRD §2.3 — divider between row 9 (Diligence Questions) and row 10 (Sources)
            const showDividerBefore = !isProcessing && item.key === "documents";
            // PRD §7.1 — Meeting Mode hides Analysis Log + Sources rows
            const meetingHide = item.key === "analysis_log" || item.key === "documents";
            const meta = getTooltipMeta(item);
            const button = (
              <button
                onClick={() => onTabChange(item.key)}
                className={cn(
                  "flex w-full items-center rounded-lg text-sm transition-colors",
                  collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2",
                  isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && renderRightChip(item)}
              </button>
            );
            return (
              <div key={item.key} data-meeting-hide={meetingHide ? "true" : undefined}>
                {showDividerBefore && <div className="my-2 h-px bg-border" />}
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {meta && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">{meta}</span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  button
                )}
              </div>
            );
            })}
          </nav>
        </TooltipProvider>
      </aside>
    </>
  );
}
