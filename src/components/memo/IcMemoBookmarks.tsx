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

  return (
    <ul className="flex flex-col gap-0.5">
      {headings.map((h) => {
        const isActive = activeIndex === h.index;
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
                "w-full rounded-md py-1 text-xs transition-colors text-left border-l-2 truncate",
                h.level === 1 ? "pl-2" : h.level === 2 ? "pl-4" : "pl-6",
                isActive
                  ? "bg-primary/10 text-foreground font-semibold border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent",
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