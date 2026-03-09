import { Card, CardBody, Chip, Avatar } from "@heroui/react";
import { Globe, ExternalLink } from "lucide-react";
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
          <p className="text-xs sm:text-sm text-default-400 mt-1">
            External research links and references used to enrich this report.
          </p>
        </div>
      </BlurFade>

      <div className="space-y-3">
        {researchSources.length === 0 ? (
          <BlurFade>
            <Card shadow="sm">
              <CardBody className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <Globe className="h-10 w-10 text-default-300 mb-3" />
                <p className="text-sm font-semibold text-foreground">No external sources yet</p>
                <p className="text-xs text-default-400 mt-1 max-w-xs">
                  Research sources and external links will appear here once the analysis enrichment is complete.
                </p>
              </CardBody>
            </Card>
          </BlurFade>
        ) : (
          researchSources.map((source, i) => (
            <BlurFade key={source.id} delay={i * 0.05}>
              <Card shadow="sm" className="group">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      size="sm"
                      radius="lg"
                      src={source.favicon_url || undefined}
                      showFallback
                      fallback={<Globe className="h-4 w-4 text-default-400" />}
                      className="bg-default-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{source.title}</p>
                          <p className="text-[11px] text-default-400 truncate">{getDomainFromUrl(source.url)}</p>
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-lg hover:bg-default-100 transition-colors opacity-60 group-hover:opacity-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-default-400" />
                        </a>
                      </div>
                      {source.description && (
                        <p className="text-xs text-default-500 mt-1 line-clamp-2">{source.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Chip size="sm" variant="flat" classNames={{ content: "text-[10px] uppercase" }}>
                          {source.source_type || 'web'}
                        </Chip>
                        <span className="text-[10px] text-default-400">
                          {formatRelativeTime(source.added_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </BlurFade>
          ))
        )}
      </div>
    </div>
  );
}
