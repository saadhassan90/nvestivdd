import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface NavEntry {
  id: string;
  label: string;
}

export function StickySectionNav({ entries, scrollRoot }: { entries: NavEntry[]; scrollRoot?: HTMLElement | null }) {
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    const els = entries
      .map((e) => document.getElementById(e.id))
      .filter((x): x is HTMLElement => !!x);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root: scrollRoot ?? null, rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [entries, scrollRoot]);

  return (
    <nav className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
      <ul className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6 py-2 text-xs">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              onClick={(ev) => {
                ev.preventDefault();
                document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "inline-flex items-center rounded-md px-2.5 py-1 font-medium whitespace-nowrap transition-colors",
                active === e.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {e.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}