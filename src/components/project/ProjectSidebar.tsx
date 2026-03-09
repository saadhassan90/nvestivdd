import { Card, CardBody, Chip, Tabs, Tab, Progress } from "@heroui/react";
import { LayoutDashboard, Layers, Shield, MessageSquare, FolderOpen, FileText } from "lucide-react";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "modules", label: "Modules", icon: Layers },
  { key: "red_flags", label: "Red Flags", icon: Shield },
  { key: "interrogatory", label: "Interrogatory", icon: MessageSquare },
  { key: "data_room", label: "Data Room", icon: FolderOpen },
  { key: "documents", label: "Research Sources", icon: FileText },
];

const MODULE_NAMES: Record<string, string> = {
  a: "Financial",
  b: "Team",
  c: "Strategy",
  d: "Terms",
  e: "Operational",
};

export function ProjectSidebar({ project, activeTab, onTabChange }: ProjectSidebarProps) {
  const moduleScores = (project.module_scores as Record<string, number>) || {};

  return (
    <>
      {/* Mobile: horizontal scrollable nav */}
      <div className="lg:hidden border-b border-divider bg-white overflow-x-auto">
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
                    ? 'bg-primary text-white'
                    : 'text-default-500 hover:text-foreground hover:bg-default-100'
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
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-divider bg-white p-6 flex-col h-full">
        {/* Fund info */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-default-100">
              <Layers className="h-5 w-5 text-default-500" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{project.fund_name}</p>
              <p className="text-[10px] text-default-400">{project.asset_class || 'N/A'}</p>
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
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-default-500 hover:text-foreground hover:bg-default-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Score card */}
        <div className="mt-auto border-t border-divider pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-default-400 mb-2">L1 Score</p>
          <div className="flex items-center gap-2 mb-2">
            <ScoreBadge score={project.composite_score || 0} size="lg" />
            <span className="text-sm text-default-400">/ 100</span>
          </div>
          {project.recommendation && (
            <p className="text-xs font-medium text-foreground mb-4">{project.recommendation}</p>
          )}

          {/* Module bars */}
          <div className="space-y-2.5">
            {Object.entries(MODULE_NAMES).map(([key, name]) => {
              const score = moduleScores[key] || 0;
              const color = score >= 85 ? 'success' : score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger';
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-default-500 font-medium">{key.toUpperCase()}: {name}</span>
                    <span className="font-semibold text-foreground">{score}</span>
                  </div>
                  <Progress value={score} color={color} size="sm" className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
