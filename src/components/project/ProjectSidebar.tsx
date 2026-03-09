import { LayoutDashboard, Layers, FileText, MessageSquare, FolderOpen } from "lucide-react";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import type { Tables } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "modules", label: "Modules", icon: Layers },
  { key: "red_flags", label: "Red Flags", icon: MessageSquare },
  { key: "interrogatory", label: "Interrogatory", icon: MessageSquare },
  { key: "data_room", label: "Data Room", icon: FolderOpen },
  { key: "documents", label: "Source Files", icon: FileText },
];

const MODULE_NAMES: Record<string, string> = {
  a: "Fund Strategy & Terms",
  b: "Track Record & Performance",
  c: "Team & Governance",
  d: "Portfolio & Risk",
  e: "Operations & Compliance",
};

export function ProjectSidebar({ project, activeTab, onTabChange }: ProjectSidebarProps) {
  const moduleScores = (project.module_scores as Record<string, number>) || {};

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card p-6 flex flex-col h-full">
      {/* Fund info */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{project.fund_name}</p>
            <p className="text-[10px] text-muted-foreground">ID: #{project.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
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

      {/* Score card */}
      <div className="mt-auto border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overall Score</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl font-bold text-foreground">{project.composite_score || '—'}</span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{project.recommendation}</p>

        {/* Module bars */}
        <div className="space-y-2">
          {Object.entries(MODULE_NAMES).map(([key, name]) => {
            const score = moduleScores[key] || 0;
            const colorClass = score >= 85 ? 'bg-score-strong' : score >= 70 ? 'bg-score-advance' : score >= 50 ? 'bg-score-review' : 'bg-score-decline';
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground uppercase font-medium">Module {key.toUpperCase()}</span>
                  <span className="font-semibold text-foreground">{score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
