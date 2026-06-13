import { cn } from "@/lib/utils";
import type { RenderPayload, SectionKey } from "@/types/renderContract";
import { RefsProvider } from "./primitives/RefsContext";
import { VerdictSection } from "./sections/VerdictSection";
import { ExecSummarySection } from "./sections/ExecSummarySection";
import { FactsheetSection } from "./sections/FactsheetSection";
import { ClaimsLedgerSection } from "./sections/ClaimsLedgerSection";
import { FlagsQuestionsSection } from "./sections/FlagsQuestionsSection";
import { ModulesSection } from "./sections/ModulesSection";
import { AgendaSection } from "./sections/AgendaSection";
import { SourcesSection } from "./sections/SourcesSection";

export type L1PageKey = "summary" | "analysis" | "agenda";

type Entry = { key: SectionKey; id: string; label: string; render: () => JSX.Element };

export const L1_PAGES: Array<{ key: L1PageKey; label: string; entries: Entry[] }> = [
  {
    key: "summary",
    label: "Executive Summary",
    entries: [
      { key: "verdict", id: "l1-verdict", label: "Verdict", render: () => <VerdictSection /> },
      { key: "executive_summary", id: "l1-exec", label: "Executive Summary", render: () => <ExecSummarySection /> },
      { key: "factsheet", id: "l1-factsheet", label: "Factsheet", render: () => <FactsheetSection /> },
    ],
  },
  {
    key: "analysis",
    label: "Analysis",
    entries: [
      { key: "claims_ledger", id: "l1-claims", label: "Claims Ledger", render: () => <ClaimsLedgerSection /> },
      { key: "flags", id: "l1-flags", label: "Flags & Questions", render: () => <FlagsQuestionsSection /> },
      { key: "modules", id: "l1-modules", label: "Modules", render: () => <ModulesSection /> },
      { key: "sources", id: "l1-sources", label: "Sources", render: () => <SourcesSection /> },
    ],
  },
  {
    key: "agenda",
    label: "Meeting Agenda",
    entries: [
      { key: "agenda", id: "l1-agenda", label: "Meeting Agenda", render: () => <AgendaSection /> },
    ],
  },
];

export function L1OnePager({ payload, page = "summary" }: { payload: RenderPayload; page?: L1PageKey }) {
  const present = new Set(payload.meta.sections_present);
  const current = L1_PAGES.find((p) => p.key === page) ?? L1_PAGES[0];
  const visible = current.entries.filter((e) => present.has(e.key));

  return (
    <RefsProvider payload={payload}>
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <main className="px-4 sm:px-6 py-6 max-w-5xl w-full mx-auto">
          {visible.map((e, idx) => (
            <div key={e.id} className={cn("pb-12", idx === visible.length - 1 && "pb-0")}>
              {e.render()}
            </div>
          ))}
        </main>
      </div>
    </RefsProvider>
  );
}