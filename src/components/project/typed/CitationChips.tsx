import { ExternalLink, FileText, Globe2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PRD v2.0 §6.4 — Dashboard Citations
 *
 * Compact inline citation chips used on the dashboard list (and reusable
 * inside section cards). Each chip shows source-type icon + short label and
 * deep-links to the original URL.
 *
 * Designed for the dashboard row context: dense, monochrome, single line.
 */

export type CitationChip = {
  id: string;
  label: string;
  url?: string | null;
  /** Mapped from research_sources.source_type. */
  type?: "web" | "doc" | "regulator" | "press" | "academic" | string | null;
  /** Optional accessed/added date — surfaced on hover. */
  date?: string | null;
};

interface CitationChipsProps {
  citations: CitationChip[];
  /** Hard cap on visible chips before "+N more" rolls up. */
  max?: number;
  className?: string;
  size?: "xs" | "sm";
}

function iconFor(type: string | null | undefined) {
  const cls = "h-3 w-3 shrink-0";
  switch ((type || "").toLowerCase()) {
    case "doc":
    case "document":
    case "pdf":
      return <FileText className={cls} />;
    case "regulator":
    case "filing":
      return <BookOpen className={cls} />;
    case "press":
    case "academic":
    case "web":
    default:
      return <Globe2 className={cls} />;
  }
}

export function CitationChips({
  citations,
  max = 3,
  className,
  size = "xs",
}: CitationChipsProps) {
  if (!citations.length) return null;

  const visible = citations.slice(0, max);
  const overflow = citations.length - visible.length;
  const sizing =
    size === "sm"
      ? "text-[11px] px-1.5 py-0.5 gap-1"
      : "text-[10px] px-1.5 py-[1px] gap-1";

  return (
    <div className={cn("inline-flex items-center gap-1 flex-wrap", className)}>
      {visible.map((c) => {
        const inner = (
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors",
              sizing,
            )}
            title={[c.label, c.date ? `Accessed ${c.date}` : null, c.url].filter(Boolean).join(" · ")}
          >
            {iconFor(c.type)}
            <span className="max-w-[140px] truncate font-medium">{c.label}</span>
            {c.url && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
          </span>
        );
        return c.url ? (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {inner}
          </a>
        ) : (
          <span key={c.id}>{inner}</span>
        );
      })}
      {overflow > 0 && (
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-dashed border-border text-muted-foreground tabular-nums",
            sizing,
          )}
          title={`${overflow} additional source${overflow === 1 ? "" : "s"}`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}