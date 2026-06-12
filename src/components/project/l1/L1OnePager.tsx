import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { RenderPayload, SectionKey } from "@/types/renderContract";
import { RefsProvider } from "./primitives/RefsContext";
import { StickySectionNav, type NavEntry } from "./primitives/StickySectionNav";
import { VerdictSection } from "./sections/VerdictSection";
import { ExecSummarySection } from "./sections/ExecSummarySection";
import { FactsheetSection } from "./sections/FactsheetSection";
import { ClaimsLedgerSection } from "./sections/ClaimsLedgerSection";
import { FlagsQuestionsSection } from "./sections/FlagsQuestionsSection";
import { ModulesSection } from "./sections/ModulesSection";
import { AgendaSection } from "./sections/AgendaSection";
import { SourcesSection } from "./sections/SourcesSection";

const ALL_ENTRIES: Array<{ key: SectionKey; id: string; label: string; render: () => JSX.Element }> = [
  { key: "verdict", id: "l1-verdict", label: "Verdict", render: () => <VerdictSection /> },
  { key: "executive_summary", id: "l1-exec", label: "Executive Summary", render: () => <ExecSummarySection /> },
  { key: "factsheet", id: "l1-factsheet", label: "Factsheet", render: () => <FactsheetSection /> },
  { key: "claims_ledger", id: "l1-claims", label: "Claims Ledger", render: () => <ClaimsLedgerSection /> },
  { key: "flags", id: "l1-flags", label: "Flags & Questions", render: () => <FlagsQuestionsSection /> },
  { key: "modules", id: "l1-modules", label: "Modules", render: () => <ModulesSection /> },
  { key: "agenda", id: "l1-agenda", label: "Meeting Agenda", render: () => <AgendaSection /> },
  { key: "sources", id: "l1-sources", label: "Sources", render: () => <SourcesSection /> },
];

export function L1OnePager({ payload }: { payload: RenderPayload }) {
  const present = useMemo(() => new Set(payload.meta.sections_present), [payload]);
  const visible = ALL_ENTRIES.filter((e) => present.has(e.key));
  const navEntries: NavEntry[] = visible.map(({ id, label }) => ({ id, label }));

  return (
    <RefsProvider payload={payload}>
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <StickySectionNav entries={navEntries} />
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