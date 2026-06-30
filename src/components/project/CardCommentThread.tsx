import { useEffect, useState, useCallback, useRef, KeyboardEvent } from "react";
import { Send, Sparkles, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type CommentRow = Tables<"comments">;

interface CardCommentThreadProps {
  projectId: string;
  sectionId: string;
  cardId: string;
  /** Human-readable card title used as accessible label only. */
  cardLabel?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

/**
 * Comment thread attached to the bottom of a SectionCard.
 * Two visual states:
 *   • empty   — single inline composer strip ("Add a comment…")
 *   • populated — chronological thread (oldest → newest) + composer at the bottom
 * Hidden in Meeting Mode via data-meeting-hide.
 */
export function CardCommentThread({
  projectId,
  sectionId,
  cardId,
  cardLabel,
}: CardCommentThreadProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", projectId)
      .eq("section_id", sectionId)
      .eq("sub_card_id", cardId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  }, [projectId, sectionId, cardId]);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel(`card-comments-${projectId}-${sectionId}-${cardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          const row = (payload.new ?? payload.old) as CommentRow | undefined;
          if (!row) return;
          if (row.section_id === sectionId && row.sub_card_id === cardId) {
            fetchComments();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, sectionId, cardId, fetchComments]);

  const post = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      project_id: projectId,
      section_id: sectionId,
      sub_card_id: cardId,
      author_type: "human",
      author_name: "You",
      body_md: trimmed,
    });
    setPosting(false);
    if (error) {
      toast({ title: "Could not post comment", variant: "destructive" });
      return;
    }
    setBody("");
    inputRef.current?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      post();
    }
  };

  const toggleResolve = async (c: CommentRow) => {
    await supabase
      .from("comments")
      .update({ resolved_at: c.resolved_at ? null : new Date().toISOString() })
      .eq("id", c.id);
  };

  const open = comments.filter((c) => !c.resolved_at);
  const resolved = comments.filter((c) => !!c.resolved_at);
  const hasComments = open.length > 0 || (showResolved && resolved.length > 0);

  return (
    <div
      data-meeting-hide="true"
      className="border-t border-border bg-muted/30"
      aria-label={cardLabel ? `Comments on ${cardLabel}` : "Comments"}
    >
      {open.length === 0 && !showResolved ? (
        // ─── EMPTY STATE ────────────────────────────────────────────────
        <div className="px-5 py-2.5 flex items-center gap-2">
          <Composer
            inputRef={inputRef}
            value={body}
            onChange={setBody}
            onKeyDown={onKey}
            onSubmit={post}
            posting={posting}
            placeholder="Add a comment…"
            compact
          />
          {resolved.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResolved(true)}
              className="text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              {resolved.length} resolved
            </button>
          )}
        </div>
      ) : (
        // ─── POPULATED STATE ────────────────────────────────────────────
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-muted-foreground">
              Comments on {cardLabel ?? "section"} · {open.length}
              {resolved.length > 0 && (
                <span className="ml-1 font-normal normal-case tracking-normal">
                  ({resolved.length} resolved)
                </span>
              )}
            </p>
            {resolved.length > 0 && (
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                {showResolved ? "Hide resolved" : "Show resolved"}
              </button>
            )}
          </div>

          <ul className="space-y-1.5 mb-3">
            {(showResolved ? comments : open).map((c) => (
              <li
                key={c.id}
                className={cn(
                  "rounded-md border bg-card px-2.5 py-2",
                  c.resolved_at ? "opacity-50 border-border/40" : "border-border/70",
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {c.author_type === "ai" ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-foreground border border-border rounded px-1 py-[1px]">
                        <Sparkles className="h-2.5 w-2.5" /> Nvestiv AI
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-foreground truncate">
                        {c.author_name}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground">
                      · {formatTime(c.created_at)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleResolve(c)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title={c.resolved_at ? "Reopen" : "Resolve"}
                  >
                    {c.resolved_at ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-xs text-foreground/85 whitespace-pre-wrap leading-snug">
                  {c.body_md}
                </p>
              </li>
            ))}
          </ul>

          <Composer
            inputRef={inputRef}
            value={body}
            onChange={setBody}
            onKeyDown={onKey}
            onSubmit={post}
            posting={posting}
            placeholder="Reply…"
          />
        </div>
      )}
      {/* Hidden anchor used for "load resolved" state when only resolved exist */}
      {hasComments ? null : null}
    </div>
  );
}

function Composer({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  posting,
  placeholder,
  compact,
}: {
  inputRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  posting: boolean;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-1 min-w-0 rounded-md border bg-background",
        compact ? "border-border/60" : "border-border",
      )}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={posting || !value.trim()}
        className="mr-1 inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:hover:bg-transparent"
        title="Post comment (Enter)"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}