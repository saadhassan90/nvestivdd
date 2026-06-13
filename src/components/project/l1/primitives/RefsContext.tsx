import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { Claim, Flag, FlagQuestion, RenderPayload, Source } from "@/types/renderContract";

interface Refs {
  sources: Map<string, Source>;
  flags: Map<string, Flag>;
  questions: Map<string, FlagQuestion>;
  claims: Map<string, Claim>;
  payload: RenderPayload;
  scrollTo: (id: string) => void;
  highlight: (id: string) => void;
}

const Ctx = createContext<Refs | null>(null);

type L1Page = "summary" | "analysis" | "agenda";
const SECTION_PAGE: Record<string, L1Page> = {
  "l1-verdict": "summary",
  "l1-exec": "summary",
  "l1-factsheet": "summary",
  "l1-claims": "analysis",
  "l1-flags": "analysis",
  "l1-modules": "analysis",
  "l1-sources": "analysis",
  "l1-agenda": "agenda",
};
function pageForId(id: string): L1Page | null {
  if (SECTION_PAGE[id]) return SECTION_PAGE[id];
  if (id.startsWith("src-") || id.startsWith("flag-") || id.startsWith("q-") || id.startsWith("claim-")) return "analysis";
  return null;
}

export function RefsProvider({ payload, children }: { payload: RenderPayload; children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = useMemo<Refs>(() => {
    const sources = new Map(payload.sources.map((s) => [s.id, s]));
    const flags = new Map(payload.flags.items.map((f) => [f.id, f]));
    const questions = new Map(payload.flags.questions.map((q) => [q.id, q]));
    const claims = new Map(payload.claims_ledger.claims.map((c) => [c.id, c]));
    const ensureOnPage = (id: string, cb: (el: HTMLElement) => void) => {
      const existing = document.getElementById(id);
      if (existing) { cb(existing); return; }
      const target = pageForId(id);
      const current = (searchParams.get("tab") as L1Page) || "summary";
      if (target && target !== current) {
        const p = new URLSearchParams(searchParams);
        p.set("tab", target);
        setSearchParams(p, { replace: true });
      }
      // Poll for the element to mount after the page switch.
      const start = Date.now();
      const tick = () => {
        const el = document.getElementById(id);
        if (el) { cb(el); return; }
        if (Date.now() - start < 1500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const scrollTo = (id: string) => ensureOnPage(id, (el) => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const highlight = (id: string) => ensureOnPage(id, (el) => {
      el.classList.add("l1-flash");
      window.setTimeout(() => el.classList.remove("l1-flash"), 1600);
    });
    return { sources, flags, questions, claims, payload, scrollTo, highlight };
  }, [payload, searchParams, setSearchParams]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRefs(): Refs {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRefs must be used inside <RefsProvider>");
  return v;
}