import { useCitations } from "@/contexts/CitationsContext";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ExternalLink, FileText, Globe2, BookOpen, Pin, PinOff, Newspaper, GraduationCap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchSource } from "@/contexts/CitationsContext";

/**
 * PRD v2.0 §6.4 — inline citation refs.
 *
 * Renders a row of dotted-underline chips for the given citation IDs (which can
 * be either `research_sources.citation_id` like "SRC_001" or raw row UUIDs).
 *
 * Hover  → tooltip with type icon, title, date, ≤240-char excerpt, "Open source →".
 * Click  → toggles pin (renders in PinnedCitationsStack bottom-right).
 */

export interface CitationRefsProps {
  ids?: Array<string | null | undefined> | null;
  /** Optional source-section deep link shown beneath each tooltip. */
  sectionHint?: string;
  className?: string;
  size?: "xs" | "sm";
  /** Override label rendered before the count. Defaults to "Sources". */
  label?: string;
}

function iconForType(type?: string | null) {
  const cls = "h-3 w-3 shrink-0";
  switch ((type || "").toLowerCase()) {
    case "doc":
    case "document":
    case "pdf":
    case "filing":
      return <FileText className={cls} />;
    case "regulator":
    case "regulatory":
      return <BookOpen className={cls} />;
    case "news":
    case "press":
      return <Newspaper className={cls} />;
    case "academic":
      return <GraduationCap className={cls} />;
    case "analysis_log":
      return <Activity className={cls} />;
    default:
      return <Globe2 className={cls} />;
  }
}

function openLabelFor(s: ResearchSource): string {
  const t = (s.source_type || "").toLowerCase();
  if (t.includes("doc") || t.includes("pdf") || t.includes("filing")) return "Open document";
  if (t.includes("regulator")) return "Open SEC EDGAR";
  if (t.includes("analysis")) return "Open Analysis Log";
  return "Open source";
}

function truncate(text: string | null | undefined, n = 240): string {
  if (!text) return "";
  return text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text;
}

export function CitationRefs({
  ids,
  sectionHint,
  className,
  size = "xs",
  label = "Sources",
}: CitationRefsProps) {
  const { resolve, isPinned, toggle } = useCitations();
  const cleaned = (ids || []).filter(Boolean) as string[];
  if (cleaned.length === 0) return null;

  const resolved = cleaned
    .map((id) => ({ id, source: resolve(id) }))
    .filter((r) => r.source); // drop unknown refs silently

  if (resolved.length === 0) return null;

  const sizing =
    size === "sm"
      ? "text-[11px] px-1.5 py-[1px] gap-1"
      : "text-[10px] px-1.5 py-[1px] gap-1";

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1 align-middle", className)}>
      <span className="text-[10px] text-muted-foreground/70 mr-0.5">
        {label} ({resolved.length})
      </span>
      {resolved.map(({ id, source }) => {
        const s = source as ResearchSource;
        const pinned = isPinned(id);
        return (
          <HoverCard key={id} openDelay={120} closeDelay={80}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(id);
                }}
                className={cn(
                  "inline-flex items-center rounded-full border tabular-nums transition-colors",
                  "border-dotted border-border/80 hover:border-foreground/40",
                  pinned
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground",
                  sizing,
                )}
                title={pinned ? "Unpin citation" : "Pin citation"}
              >
                {iconForType(s.source_type)}
                <span className="font-mono">{s.citation_id || id.slice(0, 6)}</span>
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" align="start" className="w-80 p-0 overflow-hidden">
              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2">
                {iconForType(s.source_type)}
                <span className="text-[10px] text-muted-foreground">
                  {s.source_type || "source"}
                </span>
                {s.accessed_date && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {s.accessed_date}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="text-sm font-semibold text-foreground leading-snug">
                  {s.title}
                </div>
                {s.excerpt && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    “{truncate(s.excerpt, 240)}”
                  </p>
                )}
                {sectionHint && (
                  <div className="text-[10px] text-muted-foreground/80">
                    Cited in: {sectionHint}
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {pinned ? (
                    <>
                      <PinOff className="h-3 w-3" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-3 w-3" />
                      Pin to side
                    </>
                  )}
                </button>
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {openLabelFor(s)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </span>
  );
}