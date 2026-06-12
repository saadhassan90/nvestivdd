import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionShell({ id, eyebrow, title, description, actions, children, className }: Props) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{eyebrow}</p>
          <h2 className="text-lg font-semibold text-foreground mt-0.5">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
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

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card", className)}>{children}</div>;
}

export function Subcard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-border/60 bg-background/40 p-3", className)}>{children}</div>;
}