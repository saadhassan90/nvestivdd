import { NavLink, Outlet, useParams, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getRaise } from "@/mocks/gp/raises";

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
      <div className="px-6 pt-6 max-w-5xl mx-auto w-full">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold text-foreground">{raise.name}</h1>
          <span className="text-xs text-muted-foreground">{raise.strategy} · {raise.targetSize}</span>
        </div>
      </div>
      <nav className="px-6 mt-3 border-b border-border flex gap-1 overflow-x-auto max-w-5xl mx-auto w-full">
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