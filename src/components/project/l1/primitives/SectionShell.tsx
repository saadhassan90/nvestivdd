import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSectionContext } from "@/contexts/SectionContext";
import { CardCommentThread } from "@/components/project/CardCommentThread";

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Set to true to suppress the attached comment thread on this section. */
  disableComments?: boolean;
}

export function SectionShell({ id, eyebrow, title, description, actions, children, className, disableComments }: Props) {
  const ctx = useSectionContext();
  const sectionNum = parseInt(eyebrow, 10);
  return (
    <section id={id} className={cn("scroll-mt-24 relative", className)}>
      {/* Section index ribbon — anchors the eye on the left edge */}
      <header className="flex items-start justify-between gap-3 mb-4 pb-3 border-b-2 border-foreground/80">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground leading-tight">
            Section {Number.isFinite(sectionNum) ? sectionNum : eyebrow} - {title}
          </h2>
          {description && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
      {!disableComments && ctx && (
        <div className="border-t border-border bg-muted/30">
          <CardCommentThread
            projectId={ctx.projectId}
            sectionId={ctx.sectionId}
            cardId={id}
            cardLabel={title}
          />
        </div>
      )}
    </section>
  );
}

export function EmptyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
      <p className="text-xs italic text-muted-foreground">{children}</p>
    </div>
  );
}

export function Card({
  id,
  children,
  className,
  commentId,
  commentLabel,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Stable identity for the attached comment thread. Required to render comments. */
  commentId?: string;
  commentLabel?: string;
}) {
  const ctx = useSectionContext();
  const showComments = !!ctx && !!commentId;
  return (
    <div id={id} className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {children}
      {showComments && (
        <CardCommentThread
          projectId={ctx!.projectId}
          sectionId={ctx!.sectionId}
          cardId={commentId!}
          cardLabel={commentLabel}
        />
      )}
    </div>
  );
}

export function Subcard({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return <div id={id} className={cn("rounded-lg border border-border/60 bg-background/40 p-3", className)}>{children}</div>;
}