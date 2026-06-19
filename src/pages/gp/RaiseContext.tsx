import { NavLink, Outlet, useParams, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getRaise, overallCompletion } from "@/mocks/gp/raises";

const TABS = [
  { to: "", label: "Overview", end: true },
  { to: "dataroom", label: "Dataroom" },
  { to: "ddq", label: "DDQ" },
  { to: "interview", label: "IRIS Interview" },
  { to: "report-card", label: "Report Card" },
  { to: "feedback", label: "Feedback" },
  { to: "pipeline", label: "Pipeline" },
];

export default function RaiseContext() {
  const { fundId } = useParams();
  const raise = getRaise(fundId);
  if (!raise) return <Navigate to="/raises" replace />;
  const pct = overallCompletion(raise);
  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Raise · Vintage {raise.vintage}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <h1 className="text-xl font-semibold text-foreground">{raise.name}</h1>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {raise.status}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{pct}% complete</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{raise.strategy} · Target {raise.targetSize}</p>
      </div>
      <nav className="px-6 mt-4 border-b border-border flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to || "overview"}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm border-b-2 -mb-px transition-colors whitespace-nowrap",
                isActive
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  );
}