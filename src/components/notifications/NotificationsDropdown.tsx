import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, AlertTriangle, Clock, FileBarChart, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NotificationItem {
  id: string;
  title: string;
  detail: string | null;
  timestamp: string;
  type: "complete" | "running" | "error" | "pending";
  projectId: string;
  fundName: string;
}

function getIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-score-strong shrink-0" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-severity-critical shrink-0" />;
    case "running":
      return <Clock className="h-4 w-4 text-primary shrink-0 animate-pulse" />;
    default:
      return <FileBarChart className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    (async () => {
      // Fetch recent analysis logs with project names
      const { data: logs } = await supabase
        .from("analysis_logs")
        .select("id, step_label, status, detail, created_at, project_id")
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: projects } = await supabase
        .from("projects")
        .select("id, fund_name");

      const projectMap = new Map(projects?.map((p) => [p.id, p.fund_name]) || []);

      // Deduplicate by project — show latest per project + key events
      const seen = new Set<string>();
      const items: NotificationItem[] = [];

      for (const log of logs || []) {
        const key = `${log.project_id}-${log.step_label}`;
        if (seen.has(key)) continue;
        seen.add(key);

        items.push({
          id: log.id,
          title: log.step_label,
          detail: log.detail,
          timestamp: log.created_at,
          type: log.status as NotificationItem["type"],
          projectId: log.project_id,
          fundName: projectMap.get(log.project_id) || "Unknown Fund",
        });
      }

      // Also add project-level events (completed/error)
      const { data: recentProjects } = await supabase
        .from("projects")
        .select("id, fund_name, status, updated_at, error_message")
        .in("status", ["complete", "completed", "error"])
        .order("updated_at", { ascending: false })
        .limit(10);

      for (const p of recentProjects || []) {
        const isError = p.status === "error";
        items.push({
          id: `proj-${p.id}`,
          title: isError ? "Analysis Failed" : "Analysis Complete",
          detail: isError ? (p.error_message || "An error occurred") : `L1 triage report is ready for ${p.fund_name}`,
          timestamp: p.updated_at,
          type: isError ? "error" : "complete",
          projectId: p.id,
          fundName: p.fund_name,
        });
      }

      // Sort by timestamp, take latest
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(items);
      setLoading(false);
    })();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayed = notifications.slice(0, 10);
  const hasMore = notifications.length > 10;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-muted transition-colors relative"
        title="Notifications"
      >
        <Bell className="h-4 w-4 text-muted-foreground" />
        {notifications.length > 0 && open === false && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium text-foreground lowercase">notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div>
                {displayed.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOpen(false);
                      navigate(`/project/${item.projectId}`);
                    }}
                    className="flex items-start gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
                  >
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.fundName}</p>
                      {item.detail && (
                        <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {hasMore && (
            <div className="border-t border-border px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/notifications");
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                View all activity
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
