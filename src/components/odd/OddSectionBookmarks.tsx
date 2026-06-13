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
  // Default to the first section so there's always an active highlight on
  // initial load, even before the user scrolls or the scroll-spy fires.
  const [active, setActive] = useState<OddSectionKey | null>(ODD_SECTIONS[0]?.key ?? null);

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
                "w-full rounded-md px-2 py-1 text-xs text-left transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
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