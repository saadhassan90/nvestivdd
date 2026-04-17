import { LayoutDashboard, Users, Target, TrendingUp, AlertTriangle, MessageSquare, FileText, FileBarChart, FolderOpen, ChevronDown, ChevronRight, Gauge } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
  moduleScoresData?: any[];
}

const L1_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "scorecard", label: "Scorecard", icon: Gauge },
  { key: "team", label: "Team", icon: Users },
  { key: "strategy", label: "Strategy", icon: Target },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "red_flags", label: "Risk", icon: AlertTriangle },
  { key: "interrogatory", label: "Interrogatory Matrix", icon: MessageSquare },
  { key: "documents", label: "Sources", icon: FileText },
  { key: "analysis_log", label: "Analysis Log", icon: FileBarChart },
  { key: "data_room", label: "Dataroom", icon: FolderOpen },
];

const PROCESSING_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "analysis_log", label: "Analysis Log", icon: FileBarChart },
];

type ReportLevel = "L1" | "L2" | "L3";

const REPORT_LEVELS: { key: ReportLevel; label: string }[] = [
  { key: "L1", label: "Triage" },
  { key: "L2", label: "Deep Dive" },
  { key: "L3", label: "IC Memo" },
];

export function ProjectSidebar({ project, activeTab, onTabChange }: ProjectSidebarProps) {
  const isProcessing = ["pending", "uploading", "processing", "analyzing", "extracting"].includes(project.status);
  const [activeLevel, setActiveLevel] = useState<ReportLevel>("L1");
  const [reportExpanded, setReportExpanded] = useState(true);

  // For now L2/L3 are locked
  const isLevelAvailable = (level: ReportLevel) => level === "L1";

  const navItems = isProcessing ? PROCESSING_NAV_ITEMS : L1_NAV_ITEMS;

  return (
    <>
      {/* Mobile: horizontal scrollable pills */}
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
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-background flex-col h-full">
        {/* Brand header */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">{project.fund_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{project.gp_entity_name || "Due Diligence"}</p>
            </div>
          </div>
        </div>

        {/* Report levels */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setReportExpanded(!reportExpanded)}
            className="flex w-full items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {reportExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Report
          </button>
          {reportExpanded && (
            <div className="mt-0.5 space-y-0.5">
              {REPORT_LEVELS.map((level) => {
                const available = isLevelAvailable(level.key);
                const isActive = activeLevel === level.key;
                return (
                  <button
                    key={level.key}
                    onClick={() => available && setActiveLevel(level.key)}
                    disabled={!available}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      isActive
                        ? "bg-primary/10 text-foreground font-medium border border-primary/20"
                        : available
                        ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        : "text-muted-foreground/40 cursor-not-allowed"
                    }`}
                  >
                    <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                      isActive ? "bg-foreground text-background" : available ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/40"
                    }`}>
                      {level.key}
                    </span>
                    <span className="truncate">{level.label.split("—")[1]?.trim() || level.label}</span>
                    {!available && (
                      <span className="ml-auto text-[9px] text-muted-foreground/40 font-medium">Locked</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 pt-2 space-y-0.5">
          <div className="h-px bg-border mb-2" />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
