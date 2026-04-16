import { LayoutDashboard, Building2, FileText, Archive, Settings, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.svg";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/funds", label: "Fund Submissions", icon: Building2 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/archive", label: "Institutional Archive", icon: Archive },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  onNewSubmission?: () => void;
}

export function AppSidebar({ onNewSubmission }: AppSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[220px] border-r border-border bg-card h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-xs font-bold text-background">N</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground leading-tight">The Archive</p>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Institutional Authority</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* New Submission button */}
      {onNewSubmission && (
        <div className="px-3 pb-4">
          <button
            onClick={onNewSubmission}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            New Submission
          </button>
        </div>
      )}
    </aside>
  );
}
