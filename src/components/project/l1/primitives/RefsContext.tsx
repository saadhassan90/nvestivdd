import { createContext, useContext, useMemo, type ReactNode } from "react";
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

export function RefsProvider({ payload, children }: { payload: RenderPayload; children: ReactNode }) {
  const value = useMemo<Refs>(() => {
    const sources = new Map(payload.sources.map((s) => [s.id, s]));
    const flags = new Map(payload.flags.items.map((f) => [f.id, f]));
    const questions = new Map(payload.flags.questions.map((q) => [q.id, q]));
    const claims = new Map(payload.claims_ledger.claims.map((c) => [c.id, c]));
    const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const highlight = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add("l1-flash");
      window.setTimeout(() => el.classList.remove("l1-flash"), 1600);
    };
    return { sources, flags, questions, claims, payload, scrollTo, highlight };
  }, [payload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRefs(): Refs {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRefs must be used inside <RefsProvider>");
  return v;
}