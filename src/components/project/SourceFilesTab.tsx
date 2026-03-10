import { useState } from "react";
import { Globe, ExternalLink } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ReportMarkdownSection } from "@/components/project/ReportMarkdownSection";
import type { Tables } from "@/integrations/supabase/types";

interface SourceFilesTabProps {
  researchSources: Tables<"research_sources">[];
  reportMarkdown?: string | null;
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function SourceFilesTab({ researchSources, reportMarkdown }: SourceFilesTabProps) {
  const hasMarkdown = !!reportMarkdown;
  const hasStructuredData = researchSources.length > 0;
  const [activeSection, setActiveSection] = useState<"report" | "sources">(hasMarkdown ? "report" : "sources");

  return (
    <div className="space-y-4 sm:space-y-6">
      <BlurFade>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Research Sources</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            External research links and references used to enrich this report.
          </p>
        </div>
      </BlurFade>

      {(hasMarkdown || hasStructuredData) && (
        <div className="flex items-center gap-2">
          {hasMarkdown && (
            <button
              onClick={() => setActiveSection("report")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === "report" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Report
            </button>
          )}
          {hasStructuredData && (
            <button
              onClick={() => setActiveSection("sources")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSection === "sources" ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Sources ({researchSources.length})
            </button>
          )}
        </div>
      )}

      {activeSection === "report" && (
        <ReportMarkdownSection content={reportMarkdown ?? null} />
      )}

      {activeSection === "sources" && (
        <div className="space-y-1">
          {researchSources.length === 0 ? (
            <BlurFade>
              <MagicCard>
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Globe className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-semibold text-foreground">No external sources yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Research sources and external links will appear here once the analysis enrichment is complete.
                  </p>
                </div>
              </MagicCard>
            </BlurFade>
          ) : (
            researchSources.map((source, i) => (
              <BlurFade key={source.id} delay={i * 0.02}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                    {source.favicon_url ? (
                      <img src={source.favicon_url} alt="" className="h-4 w-4 rounded-sm" />
                    ) : (
                      <Globe className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{source.title}</p>
                    <span className="text-[10px] text-muted-foreground truncate shrink-0">{getDomainFromUrl(source.url)}</span>
                  </div>
                  {source.source_type && (
                    <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-[9px] font-medium text-muted-foreground uppercase">
                      {source.source_type}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                </a>
              </BlurFade>
            ))
          )}
        </div>
      )}
    </div>
  );
}
