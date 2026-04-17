import { useState, useMemo } from "react";
import { Folder, ExternalLink, BookOpen, AlertTriangle, ListX } from "lucide-react";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import type { Tables } from "@/integrations/supabase/types";

interface SourceFilesTabProps {
  researchSources: Tables<"research_sources">[];
  reportMarkdown?: string | null;
}

const CATEGORIES = [
  { key: "A", label: "A. Primary GP Materials" },
  { key: "B", label: "B. Regulatory" },
  { key: "C", label: "C. Court & Litigation" },
  { key: "D", label: "D. Market Data & Third-Party" },
  { key: "E", label: "E. Deal-Specific Press" },
  { key: "F", label: "F. LP/Allocator Disclosure" },
  { key: "G", label: "G. Consulted — No Findings" },
];

function categorize(s: Tables<"research_sources">): string {
  const cat = (s.source_category || s.source_type || "").toLowerCase();
  if (cat.includes("primary") || cat.includes("gp")) return "A";
  if (cat.includes("regulator")) return "B";
  if (cat.includes("court") || cat.includes("litigation")) return "C";
  if (cat.includes("market") || cat.includes("third")) return "D";
  if (cat.includes("press") || cat.includes("news")) return "E";
  if (cat.includes("lp") || cat.includes("allocator")) return "F";
  if (cat.includes("negative") || cat.includes("no-finding")) return "G";
  return "D";
}

export function SourceFilesTab({ researchSources }: SourceFilesTabProps) {
  const [active, setActive] = useState<string>("A");

  const grouped = useMemo(() => {
    const m: Record<string, Tables<"research_sources">[]> = {};
    CATEGORIES.forEach((c) => (m[c.key] = []));
    researchSources.forEach((s) => {
      const c = categorize(s);
      m[c].push(s);
    });
    return m;
  }, [researchSources]);

  const negativeResults = grouped["F"].concat(grouped["G"]);

  return (
    <div className="space-y-5">
      <BlurFade>
        <SectionCard title="Source Categories" subtitle="A–G citation taxonomy (variant-aware)" icon={<Folder className="h-4 w-4" />}>
          <div className="flex flex-col md:flex-row gap-4">
            <nav className="md:w-56 shrink-0 flex md:flex-col flex-wrap gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActive(c.key)}
                  className={`text-left text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                    active === c.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {c.label} ({grouped[c.key].length})
                </button>
              ))}
            </nav>

            <div className="flex-1 min-w-0">
              {grouped[active].length === 0 ? (
                <p className="text-xs italic text-muted-foreground">No citations in this category at L1.</p>
              ) : (
                <ul className="space-y-2">
                  {grouped[active].map((s, i) => (
                    <li key={s.id} className="border-b border-border/40 pb-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-xs italic text-foreground">{s.title}</p>
                          {s.description && <p className="text-[11px] text-muted-foreground mt-0.5">{s.description}</p>}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-foreground hover:underline inline-flex items-center gap-1 truncate max-w-xs"
                            >
                              {s.url} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                            {s.accessed_date && <span className="text-[10px] text-muted-foreground">Accessed {s.accessed_date}</span>}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SectionCard>
      </BlurFade>

      {/* Disambiguation */}
      <BlurFade delay={0.06}>
        <SectionCard title="Disambiguation" subtitle="Entities explicitly excluded from this report" icon={<AlertTriangle className="h-4 w-4" />} empty emptyMessage="No disambiguation warnings parsed at L1." />
      </BlurFade>

      {/* Confidence Legend */}
      <BlurFade delay={0.08}>
        <SectionCard title="Confidence Legend" subtitle="Tagging definitions echoed from research" icon={<BookOpen className="h-4 w-4" />}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-foreground/85">
            <li><b>HIGH</b> — confirmed by primary or regulatory source</li>
            <li><b>MEDIUM</b> — multiple secondary corroborations</li>
            <li><b>LOW</b> — single source or weak corroboration</li>
            <li><b>NO_RECORDS_FOUND</b> — search executed, no hits</li>
            <li><b>DECK_CLAIM_ONLY</b> — claim sourced exclusively from GP deck</li>
          </ul>
        </SectionCard>
      </BlurFade>

      {/* Negative Results Ledger */}
      <BlurFade delay={0.1}>
        <SectionCard title="Negative-Results Ledger" subtitle="Sources consulted with no findings (audit trail)" icon={<ListX className="h-4 w-4" />} empty={negativeResults.length === 0} emptyMessage="No negative-result entries at L1.">
          {negativeResults.length > 0 && (
            <ul className="space-y-1">
              {negativeResults.map((s) => (
                <li key={s.id} className="text-xs text-muted-foreground italic">
                  {s.title} <span className="text-[10px] text-muted-foreground/60">— no relevant findings</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </BlurFade>
    </div>
  );
}
