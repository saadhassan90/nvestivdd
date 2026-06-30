import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSectionContext } from "@/contexts/SectionContext";
import { CardCommentThread } from "@/components/project/CardCommentThread";
import { slugify, cardDomId } from "@/lib/card-labels";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** When true, renders an empty-state body using emptyMessage. */
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
  bodyClassName?: string;
  id?: string;
  /**
   * Override the auto-derived card slug (defaults to slugify(title)).
   * Stable identity is important — changing this orphans existing comments.
   */
  cardId?: string;
  /** Set to true to suppress the attached comment thread on this card. */
  disableComments?: boolean;
}

/**
 * Persistent section wrapper — header always renders, body renders content
 * or a muted empty-state message. Used by every tab to enforce skeleton-first
 * UX from the PRD.
 */
export function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  empty = false,
  emptyMessage = "No data available at L1.",
  className,
  bodyClassName,
  id,
  cardId,
  disableComments = false,
}: SectionCardProps) {
  const ctx = useSectionContext();
  const resolvedCardId = cardId ?? slugify(title);
  const showComments = !disableComments && !!ctx && !!resolvedCardId;
  const domId = id ?? (showComments ? cardDomId(ctx!.sectionId, resolvedCardId) : undefined);
  return (
    <section
      id={domId}
      className={cn(
        "rounded-lg border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-border/60">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon && <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
      </header>
      <div className={cn("px-5 py-4", bodyClassName)}>
        {empty ? (
          <p className="text-xs italic text-muted-foreground py-2">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
      {showComments && (
        <CardCommentThread
          projectId={ctx!.projectId}
          sectionId={ctx!.sectionId}
          cardId={resolvedCardId}
          cardLabel={title}
        />
      )}
    </section>
  );
}
