import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import type { ExecBullet } from "@/types/renderContract";

export function ExecSummarySection() {
  const { payload } = useRefs();
  const s = payload.executive_summary;
  return (
    <SectionShell id="l1-exec" eyebrow="02" title="Executive Summary" description="Narrative plus the strengths and risks an analyst would lead with." disableComments>
      <Card className="p-5 space-y-5" commentId="executive-summary" commentLabel="Executive Summary">
        <p className="text-sm text-foreground/85 leading-relaxed">{s.narrative}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Column title="Key strengths" tone="strong" items={s.key_strengths} />
          <Column title="Key risks" tone="critical" items={s.key_risks} />
        </div>
      </Card>
    </SectionShell>
  );
}

function Column({ title, tone, items }: { title: string; tone: "strong" | "critical"; items: ExecBullet[] }) {
  const accent = tone === "strong" ? "text-score-strong" : "text-severity-critical";
  return (
    <div>
      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-2 ${accent}`}>{title}</p>
      <div className="space-y-2">
        {items.map((b, i) => (
          <Subcard key={i}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{b.category}</p>
            <p className="text-xs text-foreground/85 leading-relaxed mb-1.5">{b.detail}</p>
            <CitationChipRow ids={b.citation_ids} />
          </Subcard>
        ))}
      </div>
    </div>
  );
}