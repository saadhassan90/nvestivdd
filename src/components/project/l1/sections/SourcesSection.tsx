import { ExternalLink } from "lucide-react";
import { useRefs } from "../primitives/RefsContext";
import { Card, SectionShell } from "../primitives/SectionShell";
import { SourceTierBadge } from "../primitives/badges";
import { MethodologyDialog } from "../MethodologyDialog";

export function SourcesSection() {
  const { payload } = useRefs();
  return (
    <SectionShell
      id="l1-sources"
      eyebrow="08"
      title="Sources & Methodology"
      description="Every citation chip on the page anchors to a row here."
      actions={<MethodologyDialog methodology={payload.methodology} />}
      disableComments
    >
      <Card className="p-0" commentId="sources-list" commentLabel="Sources">
        <ul className="divide-y divide-border/60">
          {payload.sources.map((s) => (
            <li id={`src-${s.id}`} key={s.id} className="px-4 py-3 scroll-mt-28 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-mono text-[10px] text-muted-foreground">{s.id}</span>
                  <SourceTierBadge tier={s.tier} />
                  <span className="text-[10px] text-muted-foreground">{s.date}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-snug">{s.title}</p>
                <p className="text-[11px] text-muted-foreground italic">{s.publisher}</p>
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="shrink-0 inline-flex items-center text-muted-foreground hover:text-foreground"
                  title="Open source"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </SectionShell>
  );
}