import { LayoutDashboard, Layers, Shield, MessageSquare, FolderOpen, FileText, Users, TrendingUp, Target } from "lucide-react";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
  moduleScoresData?: any[];
}

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "modules", label: "Modules", icon: Layers },
  { key: "team", label: "Team & Ops", icon: Users },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "strategy", label: "Strategy", icon: Target },
  { key: "red_flags", label: "Red Flags", icon: Shield },
  { key: "interrogatory", label: "Interrogatory", icon: MessageSquare },
  { key: "data_room", label: "Data Room", icon: FolderOpen },
  { key: "documents", label: "Research Sources", icon: FileText },
];

const MODULE_NAMES: Record<string, string> = {
  module_a_financial: "Financial",
  module_b_team: "Team",
  module_c_strategy: "Strategy",
  module_d_terms: "Terms",
  module_e_operations: "Operational",
};

// Fallback for legacy keys
const LEGACY_MODULE_NAMES: Record<string, string> = {
  a: "Financial",
  b: "Team",
  c: "Strategy",
  d: "Terms",
  e: "Operational",
};

export function ProjectSidebar({ project, activeTab, onTabChange, moduleScoresData = [] }: ProjectSidebarProps) {
  // Prefer module_scores table, fall back to project.module_scores jsonb
  const legacyScores = (project.module_scores as Record<string, number>) || {};
  const hasModuleScoresTable = moduleScoresData.length > 0;

  return (
    <>
      {/* Mobile: horizontal scrollable nav */}
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: full sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border bg-card p-6 flex-col h-full">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{project.fund_name}</p>
              <p className="text-[10px] text-muted-foreground">{project.asset_class || 'N/A'}</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">L1 Score</p>
          <div className="flex items-center gap-2 mb-2">
            <ScoreBadge score={project.composite_score || 0} size="lg" />
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          {project.recommendation && (
            <p className="text-xs font-medium text-foreground mb-4">{project.recommendation}</p>
          )}

          <div className="space-y-2">
            {hasModuleScoresTable ? (
              moduleScoresData.map((ms: any) => {
                const score = ms.score || 0;
                const colorClass = score >= 85 ? 'bg-score-strong' : score >= 70 ? 'bg-score-advance' : score >= 50 ? 'bg-score-review' : 'bg-score-decline';
                const shortKey = ms.module_key?.replace('module_', '').charAt(0).toUpperCase() || '?';
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
            ) : (
              Object.entries(LEGACY_MODULE_NAMES).map(([key, name]) => {
                const score = legacyScores[key] || 0;
                const colorClass = score >= 85 ? 'bg-score-strong' : score >= 70 ? 'bg-score-advance' : score >= 50 ? 'bg-score-review' : 'bg-score-decline';
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
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
