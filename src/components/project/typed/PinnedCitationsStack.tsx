import { useCitations } from "@/contexts/CitationsContext";
import { ExternalLink, X, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.4 — Pinned citations stack.
 * Fixed bottom-right overlay; max 6 stacked. Each card is dismissable.
 * Hidden in Meeting Mode (parent hides via data-meeting-hide).
 */
export function PinnedCitationsStack() {
  const { pinned, unpin } = useCitations();
  if (pinned.length === 0) return null;

  return (
    <div
      data-meeting-hide="true"
      className={cn(
        "fixed z-40 bottom-4 right-4 w-[320px] max-h-[60vh] overflow-y-auto",
        "flex flex-col gap-2 pointer-events-auto",
      )}
      aria-label="Pinned citations"
    >
      <div className="text-[10px] text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-md border border-border self-end inline-flex items-center gap-1">
        <Pin className="h-3 w-3" />
        Pinned ({pinned.length})
      </div>
      {pinned.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-border bg-card shadow-lg overflow-hidden"
        >
          <div className="flex items-start gap-2 px-3 py-2 border-b border-border bg-muted/30">
            <span className="text-[10px] text-muted-foreground font-mono">
              {s.citation_id || s.source_type || "src"}
            </span>
            <button
              type="button"
              onClick={() => unpin(s.id)}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Unpin citation"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            <div className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
              {s.title}
            </div>
            {s.excerpt && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                “{s.excerpt}”
              </p>
            )}
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:underline"
              >
                Open source
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}