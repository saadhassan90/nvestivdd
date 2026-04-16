import { LayoutDashboard, Shield, MessageSquare, FolderOpen, FileText, Users, TrendingUp, Target, FileBarChart, AlertTriangle, HelpCircle } from "lucide-react";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
  moduleScoresData?: any[];
}

const COMPLETE_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, section: "report", moduleMatch: null },
  { key: "team", label: "Team & governance", icon: Users, section: "analysis", moduleMatch: "team" },
  { key: "performance", label: "Performance", icon: TrendingUp, section: "analysis", moduleMatch: "financial" },
  { key: "strategy", label: "Strategy & thesis", icon: Target, section: "analysis", moduleMatch: "strategy" },
  { key: "red_flags", label: "Risk & red flags", icon: AlertTriangle, section: "analysis", moduleMatch: "operations" },
  { key: "interrogatory", label: "Interrogatory matrix", icon: MessageSquare, section: null, moduleMatch: null },
  { key: "documents", label: "Sources", icon: FileText, section: null, moduleMatch: null },
  { key: "data_room", label: "Data Room", icon: FolderOpen, section: null, moduleMatch: null },
  { key: "analysis_log", label: "Analysis log", icon: FileBarChart, section: null, moduleMatch: null },
];

const PROCESSING_NAV_ITEMS = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard, section: null, moduleMatch: null },
  { key: "analysis_log", label: "Analysis Log", icon: FileBarChart, section: null, moduleMatch: null },
];

const MODULE_NAMES: Record<string, string> = {
  module_a_financial: "Financial",
  module_b_team: "Team",
  module_c_strategy: "Strategy",
  module_d_terms: "Terms",
  module_e_operations: "Operational",
};

const LEGACY_MODULE_NAMES: Record<string, string> = {
  a: "Financial",
  b: "Team",
  c: "Strategy",
  d: "Terms",
  e: "Operational",
};

export function ProjectSidebar({ project, activeTab, onTabChange, moduleScoresData = [] }: ProjectSidebarProps) {
  const isProcessing = ["pending", "uploading", "processing", "analyzing", "extracting"].includes(project.status);
  const navItems = isProcessing ? PROCESSING_NAV_ITEMS : COMPLETE_NAV_ITEMS;

  const legacyScores = (project.module_scores as Record<string, number>) || {};
  const hasModuleScoresTable = moduleScoresData.length > 0;

  // Analysis sections are the ones with section: "analysis"
  const mainItems = navItems.filter((i) => i.section !== "analysis");
  const analysisItems = navItems.filter((i) => i.section === "analysis");

  return (
    <>
      {/* Mobile: horizontal scrollable pills */}
      <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
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
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-border bg-card flex-col h-full">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">N</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground leading-tight">The Archive</p>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Due Diligence Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-0.5">
            {mainItems.map((item) => {
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
                  {item.key === "analysis_log" && isProcessing && (
                    <span className="ml-auto text-[10px] font-bold text-severity-monitor">
                      {/* Progress badge could go here */}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Analysis sections header */}
          {analysisItems.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1.5 px-3">
                Report Sections
              </p>
              <nav className="space-y-0.5">
                {analysisItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  const moduleScore = item.moduleMatch
                    ? moduleScoresData.find((ms: any) => ms.module_key?.includes(item.moduleMatch))
                    : null;
                  const score = moduleScore?.score;
                  const scoreColor = score >= 85 ? "text-score-strong" : score >= 70 ? "text-score-advance" : score >= 50 ? "text-score-review" : score ? "text-severity-critical" : "";
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
                      <span className="flex-1 text-left">{item.label}</span>
                      {score !== undefined && (
                        <span className={`text-xs font-bold ${scoreColor}`}>{score}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        {/* Score section (only when report is ready) */}
        {!isProcessing && (
          <div className="border-t border-border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">L1 Score</p>
            <div className="flex items-center gap-2 mb-2">
              <ScoreBadge score={project.composite_score || 0} size="lg" />
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            {project.recommendation && (
              <p className="text-xs font-medium text-foreground mb-3">{project.recommendation}</p>
            )}

            <div className="space-y-2">
              {hasModuleScoresTable
                ? moduleScoresData.map((ms: any) => {
                    const score = ms.score || 0;
                    const colorClass = score >= 85 ? "bg-score-strong" : score >= 70 ? "bg-score-advance" : score >= 50 ? "bg-score-review" : "bg-score-decline";
                    const shortKey = ms.module_key?.replace("module_", "").charAt(0).toUpperCase() || "?";
                    const shortLabel = MODULE_NAMES[ms.module_key] || ms.module_label || ms.module_key;
                    return (
                      <div key={ms.id}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground font-medium">{shortKey}: {shortLabel}</span>
                          <span className="font-semibold text-foreground">{score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    );
                  })
                : Object.entries(LEGACY_MODULE_NAMES).map(([key, name]) => {
                    const score = legacyScores[key] || 0;
                    const colorClass = score >= 85 ? "bg-score-strong" : score >= 70 ? "bg-score-advance" : score >= 50 ? "bg-score-review" : "bg-score-decline";
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground font-medium">{key.toUpperCase()}: {name}</span>
                          <span className="font-semibold text-foreground">{score}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted">
                          <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="border-t border-border p-3 space-y-0.5">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <HelpCircle className="h-4 w-4" />
            Support
          </button>
        </div>
      </aside>
    </>
  );
}
