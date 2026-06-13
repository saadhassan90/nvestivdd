import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ENTRIES: Array<{ id: string; label: string }> = [
  { id: "l1-verdict", label: "Verdict" },
  { id: "l1-exec", label: "Executive Summary" },
  { id: "l1-factsheet", label: "Factsheet" },
  { id: "l1-claims", label: "Claims Ledger" },
  { id: "l1-flags", label: "Flags & Questions" },
  { id: "l1-modules", label: "Modules" },
  { id: "l1-agenda", label: "Meeting Agenda" },
  { id: "l1-sources", label: "Sources" },
];

export function L1SectionBookmarks() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const els = ENTRIES
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
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.1, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <ul className="flex flex-col gap-0.5">
      {ENTRIES.map((e) => (
        <li key={e.id}>
          <a
            href={`#${e.id}`}
            onClick={(ev) => {
              ev.preventDefault();
              document.getElementById(e.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "block rounded-md px-2 py-1 text-xs transition-colors",
              active === e.id
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {e.label}
          </a>
        </li>
      ))}
    </ul>
  );
}