import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, AlertTriangle, Clock, FileBarChart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useChatContext } from "@/contexts/ChatContext";
import { Sparkles } from "lucide-react";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";

interface ActivityItem {
  id: string;
  title: string;
  detail: string | null;
  timestamp: string;
  type: "complete" | "running" | "error" | "pending";
  projectId: string;
  fundName: string;
}

function getIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-score-strong shrink-0" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-severity-critical shrink-0" />;
    case "running":
      return <Clock className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <FileBarChart className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isOpen, setIsOpen } = useChatContext();

  useEffect(() => {
    (async () => {
      const { data: logs } = await supabase
        .from("analysis_logs")
        .select("id, step_label, status, detail, created_at, project_id")
        .order("created_at", { ascending: false })
        .limit(200);

      const { data: projects } = await supabase
        .from("projects")
        .select("id, fund_name, status, updated_at, error_message")
        .order("updated_at", { ascending: false });

      const projectMap = new Map(projects?.map((p) => [p.id, p.fund_name]) || []);

      const all: ActivityItem[] = [];

      for (const log of logs || []) {
        all.push({
          id: log.id,
          title: log.step_label,
          detail: log.detail,
          timestamp: log.created_at,
          type: log.status as ActivityItem["type"],
          projectId: log.project_id,
          fundName: projectMap.get(log.project_id) || "Unknown Fund",
        });
      }

      // Add project-level events
      for (const p of projects || []) {
        if (["complete", "completed", "error"].includes(p.status)) {
          const isError = p.status === "error";
          all.push({
            id: `proj-${p.id}`,
            title: isError ? "Analysis Failed" : "Analysis Complete",
            detail: isError ? (p.error_message || "An error occurred") : `L1 triage report ready`,
            timestamp: p.updated_at,
            type: isError ? "error" : "complete",
            projectId: p.id,
            fundName: p.fund_name,
          });
        }
      }

      all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setItems(all);
      setLoading(false);
    })();
  }, []);

  // Group by date
  const grouped = items.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    const dateKey = formatDate(item.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <h1 className="text-sm font-semibold text-foreground">Activity Log</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Ask Iris</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, dateItems]) => (
              <BlurFade key={dateLabel}>
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{dateLabel}</h2>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {dateItems.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/project/${item.projectId}`)}
                        className={`flex items-start gap-3 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left ${
                          i < dateItems.length - 1 ? "border-b border-border/50" : ""
                        }`}
                      >
                        <div className="mt-0.5">{getIcon(item.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{item.title}</p>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              item.type === "complete" ? "bg-score-strong/10 text-score-strong"
                              : item.type === "error" ? "bg-severity-critical/10 text-severity-critical"
                              : item.type === "running" ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{item.fundName}</p>
                          {item.detail && (
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5 line-clamp-2">{item.detail}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{formatTime(item.timestamp)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
