import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import type { FactsheetField, FactsheetGroup } from "@/types/renderContract";
import { cn } from "@/lib/utils";

const GROUP_LABEL: Record<FactsheetGroup, string> = {
  identity: "Identity",
  scale: "Scale",
  economics: "Economics",
  governance: "Governance",
  providers: "Service providers",
};

const GROUP_ORDER: FactsheetGroup[] = ["identity", "scale", "economics", "governance", "providers"];

export function FactsheetSection() {
  const { payload } = useRefs();
  return (
    <SectionShell id="l1-factsheet" eyebrow="02" title="Fund Factsheet" description="Every figure declares its provenance — verified, GP-stated, or not disclosed." disableComments>
      <div className="space-y-3">
        {GROUP_ORDER.map((g) => {
          const fields = payload.factsheet.fields.filter((f) => f.group === g);
          if (!fields.length) return null;
          return (
            <Card key={g} className="p-4" commentId={`factsheet-${g}`} commentLabel={GROUP_LABEL[g]}>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-nvestiv-teal mb-2">{GROUP_LABEL[g]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                {fields.map((f) => <FieldRow key={f.key} f={f} />)}
              </div>
            </Card>
          );
        })}
      </div>
    </SectionShell>
  );
}

function FieldRow({ f }: { f: FactsheetField }) {
  const display = f.provenance === "not_disclosed"
    ? "—"
    : f.unit
      ? `${f.value ?? ""} ${f.unit}`.trim()
      : f.value ?? "";
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 pb-2">
      <span className="text-[10px] uppercase tracking-wider text-nvestiv-teal">{f.label}</span>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("text-sm font-semibold", f.provenance === "not_disclosed" ? "text-muted-foreground" : "text-foreground")}>
          {display}
        </span>
        <ProvenanceChip p={f.provenance} />
      </div>
      {f.provenance === "verified" && f.citation_ids.length > 0 && (
        <div className="mt-1"><CitationChipRow ids={f.citation_ids} /></div>
      )}
    </div>
  );
}

function ProvenanceChip({ p }: { p: FactsheetField["provenance"] }) {
  if (p === "verified") {
    return <span className="shrink-0 inline-flex items-center rounded border border-score-strong/40 bg-score-strong/10 text-score-strong px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Verified</span>;
  }
  if (p === "disclosed_only") {
    return <span className="shrink-0 inline-flex items-center rounded border border-severity-elevated/40 bg-severity-elevated/10 text-severity-elevated px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">GP-stated</span>;
  }
  return <span className="shrink-0 inline-flex items-center rounded border border-dashed border-border bg-muted/30 text-muted-foreground px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Not disclosed</span>;
}