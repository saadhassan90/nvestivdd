import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  level: number;
  text: string;
  /** Position within the ordered list of all H1/H2/H3 headings — used to find
   *  the matching DOM node inside the BlockNote canvas. */
  index: number;
}

function parseHeadings(markdown: string): Heading[] {
  const out: Heading[] = [];
  const lines = markdown.split("\n");
  let inCode = false;
  let index = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (m) {
      out.push({ level: m[1].length, text: m[2], index: index++ });
    }
  }
  return out;
}

/**
 * Bookmarks for the IC Memo. Parses H1–H3 headings from the live markdown
 * and emits a scroll request via a window event that `IcMemoPage` handles by
 * scrolling the matching heading in the BlockNote canvas into view.
 */
export function IcMemoBookmarks({ markdown }: { markdown: string }) {
  const headings = useMemo(() => parseHeadings(markdown), [markdown]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as number | null;
      setActiveIndex(detail ?? null);
    };
    window.addEventListener("ic-memo:active-heading", handler);
    return () => window.removeEventListener("ic-memo:active-heading", handler);
  }, []);

  if (headings.length === 0) {
    return (
      <p className="px-2 text-xs text-muted-foreground/70">No headings yet</p>
    );
  }

  // Default to the first heading so there's always an active highlight, even
  // before the user scrolls or the scroll-spy emits an index.
  const effectiveActive = activeIndex ?? 0;

  return (
    <ul className="flex flex-col gap-0.5">
      {headings.map((h) => {
        const isActive = effectiveActive === h.index;
        return (
          <li key={h.index}>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("ic-memo:scroll-to-heading", { detail: h.index }),
                )
              }
              className={cn(
                "w-full rounded-md py-1 pr-2 text-xs text-left transition-colors truncate",
                h.level === 1 ? "pl-2" : h.level === 2 ? "pl-4" : "pl-6",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
              title={h.text}
            >
              {h.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}