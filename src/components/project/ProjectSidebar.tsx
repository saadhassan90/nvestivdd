import { LayoutDashboard, Users, Target, TrendingUp, AlertTriangle, MessageSquare, FileText, FileBarChart, FolderOpen, Share2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface ProjectSidebarProps {
  project: Tables<"projects">;
  activeTab: string;
  onTabChange: (tab: string) => void;
  moduleScoresData?: any[];
}

const COMPLETE_NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
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

export function ProjectSidebar({ project, activeTab, onTabChange }: ProjectSidebarProps) {
  const isProcessing = ["pending", "uploading", "processing", "analyzing", "extracting"].includes(project.status);
  const navItems = isProcessing ? PROCESSING_NAV_ITEMS : COMPLETE_NAV_ITEMS;

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
        {/* Brand header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-xs font-bold text-background">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight truncate">{project.fund_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{project.gp_entity_name || "Due Diligence"}</p>
            </div>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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
