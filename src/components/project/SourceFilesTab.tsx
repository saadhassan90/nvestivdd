import { useState } from "react";
import { Globe, ExternalLink, Bookmark, Search, ChevronDown, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ReportMarkdownSection } from "@/components/project/ReportMarkdownSection";
import type { Tables } from "@/integrations/supabase/types";

interface SourceFilesTabProps {
  researchSources: Tables<"research_sources">[];
  reportMarkdown?: string | null;
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  gp_provided: "GP-Provided",
  regulatory_filing: "Regulatory Filing",
  benchmark: "Benchmark",
  journal_article: "Journal Article",
  white_paper: "White Paper",
  public_record: "Public Record",
  news: "News",
  web: "Web",
  database: "Database",
};

const CATEGORY_ICONS: Record<string, string> = {
  risk: "Risk",
  strategy: "Strategy",
  performance: "Performance",
  team: "Team",
  terms: "Terms",
  operations: "Operations",
};

const VERIFICATION_STYLE: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  verified: { color: "text-score-strong", icon: CheckCircle2 },
  flagged: { color: "text-severity-elevated", icon: AlertCircle },
};

export function SourceFilesTab({ researchSources, reportMarkdown }: SourceFilesTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const [activeSection, setActiveSection] = useState<"report" | "sources">(hasMarkdown ? "report" : "sources");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  // Derive unique source types for filter
  const sourceTypes = Array.from(new Set(researchSources.map((s) => s.source_type || "web")));

  // Filter & search
  let filtered = researchSources;
  if (filterType !== "all") {
    filtered = filtered.filter((s) => (s.source_type || "web") === filterType);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q)
    );
  }

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Header ── */}
      <BlurFade>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Archive Section
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Source appendix
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {researchSources.length} sources consulted · APA 7th Edition format
            </p>
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 shrink-0 self-start">
            {hasMarkdown && (
              <button
                onClick={() => setActiveSection(activeSection === "report" ? "sources" : "report")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
                  activeSection === "report"
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Report
              </button>
            )}
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setVisibleCount(10); }}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Sources</option>
              {sourceTypes.map((t) => (
                <option key={t} value={t}>
                  {SOURCE_TYPE_LABELS[t] || t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </BlurFade>

      {/* ── Search ── */}
      {activeSection === "sources" && researchSources.length > 5 && (
        <BlurFade delay={0.05}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search the repository..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(10); }}
              className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </BlurFade>
      )}

      {/* ── Report view ── */}
      {activeSection === "report" && (
        <ReportMarkdownSection content={reportMarkdown ?? null} />
      )}

      {/* ── Sources list ── */}
      {activeSection === "sources" && (
        <>
          {filtered.length === 0 ? (
            <BlurFade>
              <MagicCard>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? "No sources match your search." : "No sources available yet."}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Research sources will appear once the analysis is complete.
                  </p>
                </div>
              </MagicCard>
            </BlurFade>
          ) : (
            <div className="space-y-4">
              {/* ── Desktop list ── */}
              <div className="hidden sm:block space-y-0">
                {visible.map((source, i) => (
                  <SourceRow key={source.id} source={source} index={i} />
                ))}
              </div>

              {/* ── Mobile cards ── */}
              <div className="sm:hidden space-y-4">
                {visible.map((source, i) => (
                  <SourceCard key={source.id} source={source} index={i} />
                ))}
              </div>

              {/* Load more */}
              {remaining > 0 && (
                <button
                  onClick={() => setVisibleCount((c) => c + 20)}
                  className="w-full rounded-lg border border-border py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
                >
                  Load {Math.min(remaining, 20)} additional sources
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Desktop Source Row ── */
function SourceRow({ source, index }: { source: Tables<"research_sources">; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const citationNumber = source.citation_id?.replace(/\D/g, "") || String(index + 1);
  const isPrimary = source.is_primary;
  const linkedSections = (source.linked_sections as string[]) || [];
  const sourceType = source.source_type || "web";

  return (
    <BlurFade delay={index * 0.02}>
      <div className={`border-l-2 ${isPrimary ? "border-l-primary" : "border-l-score-strong"} rounded-r-lg border border-l-0 border-border bg-card p-4 sm:p-5 mb-3 hover:shadow-sm transition-shadow`}>
        <div className="flex items-start gap-4">
          {/* Citation number */}
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isPrimary ? "bg-primary/10 text-primary" : "bg-score-strong/10 text-score-strong"
          }`}>
            {citationNumber}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title — italic for APA style */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground italic leading-relaxed">
                {source.title}
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>

            {/* Description */}
            {source.description && (
              <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center rounded border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
                {SOURCE_TYPE_LABELS[sourceType] || sourceType}
              </span>
              {linkedSections.length > 0 && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Referenced in {linkedSections.map((s) => `§${s}`).join(", ")}
                </span>
              )}
            </div>

            {/* Expandable excerpt */}
            {source.excerpt && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 mt-3 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                  {expanded ? "Hide findings" : "Retrieval findings"}
                </button>
                {expanded && (
                  <div className="mt-2 rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Retrieval Findings
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{source.excerpt}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pl-12">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Open source <ExternalLink className="h-3 w-3" />
          </a>
          {source.accessed_date && (
            <span className="text-[10px] text-muted-foreground">
              Accessed {source.accessed_date}
            </span>
          )}
        </div>
      </div>
    </BlurFade>
  );
}

/* ── Mobile Source Card ── */
function SourceCard({ source, index }: { source: Tables<"research_sources">; index: number }) {
  const citationId = source.citation_id || `SRC-${String(index + 1).padStart(4, "0")}`;
  const linkedSections = (source.linked_sections as string[]) || [];
  const categories = (source.source_category?.split(",").map((s: string) => s.trim()) || []);
  const sourceType = source.source_type || "web";

  return (
    <BlurFade delay={index * 0.03}>
      <MagicCard>
        {/* Ref badge + bookmark */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-score-strong/10 text-score-strong border border-score-strong/20">
            REF: {citationId}
          </span>
          <Bookmark className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Title — APA italic */}
        <p className="text-sm font-medium text-foreground italic leading-relaxed mt-2">
          {source.title}
        </p>
        {source.description && (
          <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <FileText className="h-3 w-3" />
            {SOURCE_TYPE_LABELS[sourceType] || sourceType}
          </span>
          {categories.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {categories.join(", ")}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {source.excerpt && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Retrieval Findings
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{source.excerpt}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Open source <ExternalLink className="h-3 w-3" />
          </a>
          {source.accessed_date && (
            <span className="text-[10px] text-muted-foreground">
              Accessed {source.accessed_date}
            </span>
          )}
        </div>
      </MagicCard>
    </BlurFade>
  );
}
