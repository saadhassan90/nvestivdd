import { Fragment } from "react";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell, Subcard } from "../primitives/SectionShell";
import { CitationChipRow } from "../primitives/CitationChip";
import type { ExecBullet } from "@/types/renderContract";

export function ExecSummarySection() {
  const { payload } = useRefs();
  const s = payload.executive_summary;
  const rowCount = Math.max(s.key_strengths.length, s.key_risks.length);
  return (
    <SectionShell id="l1-exec" eyebrow="02" title="Executive Summary" description="Narrative plus the strengths and risks an analyst would lead with." disableComments>
      <Card className="p-5 space-y-5" commentId="executive-summary" commentLabel="Executive Summary">
        <p className="text-sm text-foreground/85 leading-relaxed">{s.narrative}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 auto-rows-fr">
          <ColumnHeader title="Key strengths" tone="strong" />
          <ColumnHeader title="Key risks" tone="critical" />
          {Array.from({ length: rowCount }).map((_, i) => (
            <Fragment key={i}>
              <BulletCell bullet={s.key_strengths[i]} />
              <BulletCell bullet={s.key_risks[i]} />
            </Fragment>
          ))}
        </div>
      </Card>
    </SectionShell>
  );
}

function ColumnHeader({ title, tone }: { title: string; tone: "strong" | "critical" }) {
  const accent = tone === "strong" ? "text-score-strong" : "text-severity-critical";
  return <p className={`text-[10px] uppercase tracking-wider font-semibold ${accent} row-auto`} style={{ gridRow: 1 }}>{title}</p>;
}

function BulletCell({ bullet }: { bullet?: ExecBullet }) {
  if (!bullet) return <div />;
  return (
    <Subcard className="h-full flex flex-col">
      <p className="text-[10px] uppercase tracking-wider text-foreground font-semibold mb-1">{bullet.category}</p>
      <p className="text-xs text-foreground/85 leading-relaxed mb-1.5 flex-1">{bullet.detail}</p>
      <CitationChipRow ids={bullet.citation_ids} />
    </Subcard>
  );
}