import { useState, useMemo } from "react";
import { Folder, ExternalLink, BookOpen, AlertTriangle, ListX, Search, Star, ArrowUpRight } from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { BlurFade } from "@/components/magicui/BlurFade";
import { SectionCard } from "@/components/project/primitives/SectionCard";
import { KpiTile } from "@/components/project/primitives/KpiTile";
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

// Map linked_sections strings → project tab slugs
const SECTION_TO_TAB: Record<string, { tab: string; label: string }> = {
  team: { tab: "team", label: "Team" },
  manager: { tab: "team", label: "Team" },
  track_record: { tab: "track_record", label: "Track Record" },
  performance: { tab: "track_record", label: "Track Record" },
  thesis: { tab: "investment_thesis", label: "Thesis" },
  strategy: { tab: "investment_thesis", label: "Thesis" },
  market: { tab: "market_reality", label: "Market" },
  domain: { tab: "market_reality", label: "Market" },
  economics: { tab: "economics", label: "Economics" },
  fees: { tab: "economics", label: "Economics" },
  terms: { tab: "economics", label: "Economics" },
  regulatory: { tab: "regulatory_ops", label: "Reg & Ops" },
  ops: { tab: "regulatory_ops", label: "Reg & Ops" },
};

function resolveSectionLink(section: string): { tab: string; label: string } | null {
  const s = section.toLowerCase();
  for (const key of Object.keys(SECTION_TO_TAB)) {
    if (s.includes(key)) return SECTION_TO_TAB[key];
  }
  return null;
}

export function SourceFilesTab({ researchSources }: SourceFilesTabProps) {
  const [active, setActive] = useState<string>("A");
  const [query, setQuery] = useState("");
  const [primaryOnly, setPrimaryOnly] = useState(false);
  const { id: projectId } = useParams<{ id: string }>();

  const grouped = useMemo(() => {
    const m: Record<string, Tables<"research_sources">[]> = {};
    CATEGORIES.forEach((c) => (m[c.key] = []));
    researchSources.forEach((s) => {
      const c = categorize(s);
      m[c].push(s);
    });
    return m;
  }, [researchSources]);

  const negativeResults = grouped["G"];
  const primaryCount = researchSources.filter((s) => s.is_primary).length;

  const filtered = useMemo(() => {
    let list = grouped[active] || [];
    if (primaryOnly) list = list.filter((s) => s.is_primary);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.url?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [grouped, active, primaryOnly, query]);

  return (
    <div className="space-y-5">
      {/* Citation Summary KPIs */}
      <BlurFade>
        <SectionCard title="Citation Summary" subtitle="Total · primary · negative-result audit trail" icon={<BookOpen className="h-4 w-4" />}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile label="Total Citations" value={researchSources.length || null} />
            <KpiTile label="Primary Sources" value={primaryCount || null} tone={primaryCount > 0 ? "good" : "neutral"} />
            <KpiTile label="Regulatory" value={grouped["B"].length || null} />
            <KpiTile label="Negative Results" value={negativeResults.length || null} tone="neutral" />
          </div>
        </SectionCard>
      </BlurFade>

      <BlurFade>
        <SectionCard title="Source Categories" subtitle="A–G citation taxonomy (variant-aware)" icon={<Folder className="h-4 w-4" />}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-border">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by title, URL, or description"
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
              />
            </div>
            <button
              onClick={() => setPrimaryOnly((v) => !v)}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
                primaryOnly ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="h-3 w-3" /> Primary only
            </button>
          </div>

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
              {filtered.length === 0 ? (
                <p className="text-xs italic text-muted-foreground">
                  {grouped[active].length === 0
                    ? "No citations in this category at L1."
                    : "No citations match the current filter."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((s, i) => {
                    const linkedSections = Array.isArray(s.linked_sections) ? (s.linked_sections as string[]) : [];
                    return (
                      <li key={s.id} className="border-b border-border/40 pb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-1.5">
                              <p className="text-xs italic text-foreground flex-1">{s.title}</p>
                              {s.is_primary && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider text-score-strong border border-score-strong/30 rounded px-1 py-[1px] shrink-0">
                                  <Star className="h-2 w-2" /> Primary
                                </span>
                              )}
                              {s.citation_id && (
                                <span className="text-[9px] font-mono text-muted-foreground border border-border rounded px-1 py-[1px] shrink-0">
                                  {s.citation_id}
                                </span>
                              )}
                            </div>
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
                            {linkedSections.length > 0 && projectId && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Cited in:</span>
                                {linkedSections.map((sec, idx) => {
                                  const link = resolveSectionLink(sec);
                                  if (!link) {
                                    return (
                                      <span key={idx} className="text-[9px] text-muted-foreground border border-border rounded px-1 py-[1px]">
                                        {sec}
                                      </span>
                                    );
                                  }
                                  return (
                                    <RouterLink
                                      key={idx}
                                      to={`/project/${projectId}?tab=${link.tab}`}
                                      className="inline-flex items-center gap-0.5 text-[9px] font-medium text-foreground border border-border hover:border-foreground/40 rounded px-1 py-[1px]"
                                    >
                                      {link.label} <ArrowUpRight className="h-2 w-2" />
                                    </RouterLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
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
