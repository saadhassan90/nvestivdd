import { Globe, ExternalLink } from "lucide-react";
import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import type { Tables } from "@/integrations/supabase/types";
import { formatRelativeTime } from "@/lib/score-utils";

interface SourceFilesTabProps {
  researchSources: Tables<"research_sources">[];
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function SourceFilesTab({ researchSources }: SourceFilesTabProps) {
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

      <div className="space-y-3">
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
            <BlurFade key={source.id} delay={i * 0.05}>
              <MagicCard className="group">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {source.favicon_url ? (
                      <img src={source.favicon_url} alt="" className="h-5 w-5 rounded" />
                    ) : (
                      <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{source.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{getDomainFromUrl(source.url)}</p>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors opacity-60 group-hover:opacity-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </div>
                    {source.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                        {source.source_type || 'web'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(source.added_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          ))
        )}
      </div>
    </div>
  );
}
