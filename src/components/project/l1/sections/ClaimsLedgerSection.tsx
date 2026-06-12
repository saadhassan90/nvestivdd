import { useMemo } from "react";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, EmptyNotice } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import { DispositionBadge } from "../primitives/badges";
import {
  LEDGER_SECTION_ID,
  setLedgerFilters,
  useLedgerFilters,
} from "../primitives/ledgerFilters";
import type { ClaimCategory, Disposition } from "@/types/renderContract";
import { cn } from "@/lib/utils";

const DISPOSITIONS: Disposition[] = ["CONFIRMED", "CONTRADICTED", "UNVERIFIABLE"];
const CATEGORIES: ClaimCategory[] = ["fund", "company", "person"];

export function ClaimsLedgerSection() {
  const { payload } = useRefs();
  const filters = useLedgerFilters();
  const claims = payload.claims_ledger.claims;

  const dispositionCounts = useMemo(() => {
    const out: Record<Disposition, number> = { CONFIRMED: 0, CONTRADICTED: 0, UNVERIFIABLE: 0 };
    claims.forEach((c) => { out[c.disposition]++; });
    return out;
  }, [claims]);

  const categoryCounts = useMemo(() => {
    const out: Record<ClaimCategory, number> = { fund: 0, company: 0, person: 0 };
    claims.forEach((c) => { out[c.category]++; });
    return out;
  }, [claims]);

  const visible = claims.filter(
    (c) =>
      (filters.disposition === "ALL" || c.disposition === filters.disposition) &&
      (filters.category === "ALL" || c.category === filters.category),
  );

  const grouped = CATEGORIES.map((cat) => ({
    cat,
    rows: visible.filter((c) => c.category === cat),
  }));

  return (
    <SectionShell
      id={LEDGER_SECTION_ID}
      eyebrow="04"
      title="Claims Ledger"
      description="Every deck claim, once, with disposition, evidence, and citations."
      disableComments
    >
      <div className="space-y-2">
        {/* Tab selector card */}
        <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <FilterPill
              active={filters.disposition === "ALL"}
              onClick={() => setLedgerFilters({ disposition: "ALL" })}
              count={claims.length}
            >All</FilterPill>
            {DISPOSITIONS.map((d) => (
              <FilterPill
                key={d}
                active={filters.disposition === d}
                onClick={() => setLedgerFilters({ disposition: d })}
                count={dispositionCounts[d]}
                tone={d}
              >
                {d.toLowerCase()}
              </FilterPill>
            ))}
          </div>
          <span className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <FilterPill
              active={filters.category === "ALL"}
              onClick={() => setLedgerFilters({ category: "ALL" })}
              count={claims.length}
              muted
            >All categories</FilterPill>
            {CATEGORIES.map((c) => (
              <FilterPill
                key={c}
                active={filters.category === c}
                onClick={() => setLedgerFilters({ category: c })}
                count={categoryCounts[c]}
                muted
              >
                {c}
              </FilterPill>
            ))}
          </div>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            Showing {visible.length} of {claims.length}
          </span>
        </div>

        {/* Claims list card — separate, attached below the tab selector */}
        <Card commentId="claims-ledger" commentLabel="Claims Ledger">
        {visible.length === 0 ? (
          <div className="p-4"><EmptyNotice>No claims match these filters.</EmptyNotice></div>
        ) : (
          <ul className="p-4 space-y-3">
            {grouped.flatMap(({ rows }) => rows).map((c) => (
              <li key={c.id} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <DispositionBadge d={c.disposition} />
                    <span className="text-[10px] uppercase tracking-wider text-nvestiv-teal">{c.entity}</span>
                    {c.severity !== "INFO" && (
                      <span className="text-[10px] font-bold uppercase text-severity-elevated">· {c.severity}</span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{c.id}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-snug">{c.claim}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{c.evidence}</p>
                <div className="mt-1.5"><CitationChipRow ids={c.citation_ids} /></div>
              </li>
            ))}
          </ul>
        )}
        </Card>
      </div>
    </SectionShell>
  );
}

function FilterPill({
  active, onClick, count, children, tone, muted,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
  tone?: Disposition;
  muted?: boolean;
}) {
  const toneCls =
    tone === "CONFIRMED"
      ? active ? "bg-score-strong text-background border-score-strong" : "border-score-strong/40 text-score-strong hover:bg-score-strong/10"
      : tone === "CONTRADICTED"
        ? active ? "bg-severity-critical text-background border-severity-critical" : "border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10"
        : tone === "UNVERIFIABLE"
          ? active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
          : muted
            ? active ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-muted"
            : active ? "bg-foreground text-background border-foreground" : "border-border text-foreground hover:bg-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
        toneCls,
      )}
    >
      <span className="capitalize">{children}</span>
      <span className="tabular-nums opacity-70">({count})</span>
    </button>
  );
}