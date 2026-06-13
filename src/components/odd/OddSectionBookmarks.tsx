import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ODD_SECTIONS, type OddSectionKey } from "@/lib/odd-template";

/**
 * Bookmarks for the ODD report sections. Click → scrolls the canvas to that
 * section. Highlights the currently-visible section. Coordination with
 * `OddWorkspace` happens via window CustomEvents so the rail can live in the
 * page shell while the canvas lives further down the tree.
 */
export function OddSectionBookmarks() {
  const [active, setActive] = useState<OddSectionKey | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as OddSectionKey | null;
      setActive(detail ?? null);
    };
    window.addEventListener("odd:active-section", handler);
    return () => window.removeEventListener("odd:active-section", handler);
  }, []);

  return (
    <ul className="flex flex-col gap-0.5">
      {ODD_SECTIONS.map((s) => {
        const isActive = active === s.key;
        return (
          <li key={s.key}>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("odd:scroll-to-section", { detail: s.key }),
                )
              }
              className={cn(
                "w-full rounded-md px-2 py-1 text-xs transition-colors text-left border-l-2",
                isActive
                  ? "bg-primary/10 text-foreground font-semibold border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent",
              )}
            >
              {s.title}
            </button>
          </li>
        );
      })}
    </ul>
  );
}