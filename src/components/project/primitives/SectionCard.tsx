import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
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
    </section>
  );
}
