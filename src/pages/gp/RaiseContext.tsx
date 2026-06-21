import { useState } from "react";
import { NavLink, Outlet, useParams, Navigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRaise } from "@/mocks/gp/raises";
import { ShareRaiseModal } from "@/components/gp/ShareRaiseModal";

const TAB_GROUPS: { label: string; tabs: { to: string; label: string; end?: boolean }[] }[] = [
  {
    label: "Setup",
    tabs: [
      { to: "", label: "Overview", end: true },
      { to: "dataroom", label: "Dataroom" },
      { to: "ddq", label: "DDQ" },
      { to: "interview", label: "IRIS Interview" },
    ],
  },
  {
    label: "Feedback",
    tabs: [
      { to: "report-card", label: "Report Card" },
      { to: "feedback", label: "Feedback" },
      { to: "pipeline", label: "Pipeline" },
    ],
  },
];

export default function RaiseContext() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return <Navigate to="/raises" replace />;
  const [shareOpen, setShareOpen] = useState(false);
  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{raise.name}</h1>
            <span className="text-xs text-muted-foreground truncate">{raise.strategy} · {raise.targetSize}</span>
          </div>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share raise"
            title="Share raise"
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="px-6 mt-3 border-b border-border flex items-stretch gap-5 overflow-x-auto max-w-5xl mx-auto w-full">
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-stretch gap-1">
            {gi > 0 && (
              <div aria-hidden className="mr-3 self-stretch w-px bg-border" />
            )}
            <span className="self-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 pr-1 select-none">
              {group.label}
            </span>
            {group.tabs.map((t) => (
              <NavLink
                key={t.to || "overview"}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap",
                    isActive
                      ? "border-foreground text-foreground font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
      <ShareRaiseModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        raiseName={raise.name}
        raiseId={raise.id}
      />
    </div>
  );
}