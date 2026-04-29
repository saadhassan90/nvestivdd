import { useEffect, useState, useMemo, useCallback } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Send, Sparkles, Check, X, ListFilter, MessagesSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { sectionLabel, cardLabelFromId, cardDomId } from "@/lib/card-labels";
import type { Tables } from "@/integrations/supabase/types";

type CommentRow = Tables<"comments">;

interface CommentsRailProps {
  projectId: string;
  projectName?: string;
  activeSection: string;
  isProcessing?: boolean;
}

const FILTERS = ["All", "Team", "AI", "Section"] as const;
type Filter = typeof FILTERS[number];

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

export function CommentsRail({ projectId, projectName, activeSection, isProcessing }: CommentsRailProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (!error && data) setComments(data);
  }, [projectId]);

  useEffect(() => {
    fetchComments();
    const ch = supabase
      .channel(`comments-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `project_id=eq.${projectId}` },
        () => fetchComments()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [projectId, fetchComments]);

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (filter === "Team") return c.author_type === "human";
      if (filter === "AI") return c.author_type === "ai";
      if (filter === "Section") return c.section_id === activeSection;
      return true;
    });
  }, [comments, filter, activeSection]);

  const handlePost = async () => {
    if (!body.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      project_id: projectId,
      section_id: activeSection,
      author_type: "human",
      author_name: "You",
      body_md: body.trim(),
    });
    setPosting(false);
    if (error) {
      toast({ title: "Could not post comment", variant: "destructive" });
      return;
    }
    setBody("");
    setOpen(false);
  };

  const toggleResolve = async (c: CommentRow) => {
    await supabase
      .from("comments")
      .update({ resolved_at: c.resolved_at ? null : new Date().toISOString() })
      .eq("id", c.id);
  };

  const goToCard = (c: CommentRow) => {
    if (c.section_id && c.section_id !== activeSection) {
      navigate(`/project/${projectId}?tab=${c.section_id}`);
    }
    if (c.section_id && c.sub_card_id) {
      const id = cardDomId(c.section_id, c.sub_card_id);
      // wait a tick for tab switch / mount
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary/40");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary/40"), 1800);
        }
      }, 120);
    }
  };

  const counts = useMemo(
    () => ({
      All: comments.length,
      Team: comments.filter((c) => c.author_type === "human").length,
      AI: comments.filter((c) => c.author_type === "ai").length,
      Section: comments.filter((c) => c.section_id === activeSection).length,
    }),
    [comments, activeSection]
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 pr-12 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MessagesSquare className="h-3.5 w-3.5" />
              Comments
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{projectName || "Deal"}</p>
          </div>
        </div>
        {/* Filter tabs */}
        <div className="mt-3 flex items-center gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                filter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {f === "Section" && <ListFilter className="h-2.5 w-2.5" />}
              {f}
              <span className="opacity-70 tabular-nums">{counts[f]}</span>
            </button>
          ))}
          <button
            onClick={() => setOpen(true)}
            disabled={isProcessing}
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <RouterLink
          to={`/project/${projectId}/comments`}
          className="mt-2 inline-block text-[10px] text-muted-foreground hover:text-foreground hover:underline"
        >
          View all comments →
        </RouterLink>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No comments yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Discuss findings inline</p>
          </div>
        ) : (
          filtered.map((c) => (
            <article
              key={c.id}
              className={cn(
                "rounded-md border bg-card p-2.5 cursor-pointer hover:border-foreground/30 transition-colors",
                c.resolved_at ? "opacity-50 border-border/40" : "border-border"
              )}
              onClick={() => goToCard(c)}
            >
              <header className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {c.author_type === "ai" ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider text-foreground border border-border rounded px-1 py-[1px]">
                      <Sparkles className="h-2.5 w-2.5" /> Nvestiv AI
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-foreground truncate">{c.author_name}</span>
                  )}
                  <span className="text-[9px] text-muted-foreground">· {formatTime(c.created_at)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleResolve(c); }}
                  className="text-muted-foreground hover:text-foreground"
                  title={c.resolved_at ? "Reopen" : "Resolve"}
                >
                  {c.resolved_at ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                </button>
              </header>
              <p className="text-xs text-foreground/85 whitespace-pre-wrap leading-snug">{c.body_md}</p>
              {c.section_id && (
                <p className="mt-1.5 text-[9px] text-muted-foreground">
                  in{" "}
                  <span className="font-medium text-foreground/80">
                    {sectionLabel(c.section_id)}
                  </span>
                  {c.sub_card_id && (
                    <>
                      <span className="mx-1 text-muted-foreground/60">›</span>
                      <span className="font-medium text-foreground/80">
                        {cardLabelFromId(c.sub_card_id)}
                      </span>
                    </>
                  )}
                  {c.severity && (
                    <span className="ml-1.5 inline-flex items-center rounded border border-severity-critical/30 px-1 py-[1px] text-severity-critical">
                      {c.severity}
                    </span>
                  )}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      {/* Add modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">
              Add comment to <span className="font-semibold">{sectionLabel(activeSection)}</span>
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a markdown-formatted note for the deal team…"
            className="min-h-[140px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handlePost} disabled={posting || !body.trim()}>
              <Send className="h-3.5 w-3.5 mr-1" /> Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
