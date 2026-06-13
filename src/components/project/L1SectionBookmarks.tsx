import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { L1_PAGES, type L1PageKey } from "@/components/project/l1/L1OnePager";

interface Props {
  page: L1PageKey;
  onPageChange: (p: L1PageKey) => void;
}

export function L1SectionBookmarks({ page, onPageChange }: Props) {
  const [active, setActive] = useState<string>("");
  const current = L1_PAGES.find((p) => p.key === page) ?? L1_PAGES[0];

  useEffect(() => {
    const els = current.entries
      .map((e) => document.getElementById(e.id))
      .filter((x): x is HTMLElement => !!x);
    if (!els.length) {
      setActive("");
      return;
    }
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
  }, [current]);

  return (
    <ul className="flex flex-col gap-0.5">
      {L1_PAGES.map((p) => {
        const isActive = p.key === page;
        return (
          <li key={p.key}>
            <button
              type="button"
              onClick={() => onPageChange(p.key)}
              className={cn(
                "w-full flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors text-left",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <ChevronRight
                className={cn("h-3 w-3 shrink-0 transition-transform", isActive && "rotate-90")}
              />
              <span className="truncate">{p.label}</span>
            </button>
            {isActive && (
              <ul className="mt-0.5 ml-4 flex flex-col gap-0.5 border-l border-border/60 pl-2">
                {p.entries.map((e) => (
                  <li key={e.id}>
                    <a
                      href={`#${e.id}`}
                      onClick={(ev) => {
                        ev.preventDefault();
                        document
                          .getElementById(e.id)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={cn(
                        "block rounded-md px-2 py-1 text-[11px] transition-colors",
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
            )}
          </li>
        );
      })}
    </ul>
  );
}