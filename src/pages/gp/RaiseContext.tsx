import { NavLink, Outlet, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Raise</p>
        <h1 className="text-xl font-semibold text-foreground mt-0.5">{fundId}</h1>
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