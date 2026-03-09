import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { MarkdownContent } from "@/components/project/MarkdownContent";
import type { Tables } from "@/integrations/supabase/types";

interface ModuleTabProps {
  sections: Tables<"report_sections">[];
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const MODULES = [
  { key: "module_a", letter: "A", name: "Financial & Performance" },
  { key: "module_b", letter: "B", name: "Team & Management" },
  { key: "module_c", letter: "C", name: "Strategy & Market" },
  { key: "module_d", letter: "D", name: "Terms & Structure" },
  { key: "module_e", letter: "E", name: "Operational Quick-Check" },
];

export function ModuleTab({ sections, activeModule, onModuleChange }: ModuleTabProps) {
  const section = sections.find(s => s.section_key === activeModule);
  const currentModule = MODULES.find(m => m.key === activeModule);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Module selector */}
      <div className="lg:w-56 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 hidden lg:block">Report Modules</p>

        {/* Mobile: horizontal pills */}
        <div className="lg:hidden overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-2">
            {MODULES.map((mod) => {
              const modSection = sections.find(s => s.section_key === mod.key);
              const isActive = activeModule === mod.key;
              return (
                <button
                  key={mod.key}
                  onClick={() => onModuleChange(mod.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mod.letter}: {mod.name}
                  {modSection?.score && (
                    <span className="text-[9px] opacity-70">{modSection.score}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: vertical list with scores */}
        <div className="hidden lg:block space-y-1">
          {MODULES.map((mod) => {
            const modSection = sections.find(s => s.section_key === mod.key);
            const isActive = activeModule === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => onModuleChange(mod.key)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className="truncate">{mod.letter}: {mod.name}</span>
                {modSection?.score && (
                  <span className="text-[10px] font-bold shrink-0">{modSection.score}/100</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <BlurFade>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Module {currentModule?.letter}: {currentModule?.name}
              </h2>
              {section?.confidence && (
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: <span className="font-medium text-foreground uppercase">{section.confidence}</span>
                </p>
              )}
            </div>
            {section?.score != null && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Module Score</span>
                <ScoreBadge score={section.score} size="md" />
              </div>
            )}
          </div>
        </BlurFade>

        {section?.content ? (
          <BlurFade delay={0.1}>
            <MagicCard>
              <MarkdownContent content={section.content} />
            </MagicCard>
          </BlurFade>
        ) : (
          <MagicCard>
            <p className="text-sm text-muted-foreground text-center py-8">No analysis content available for this module yet.</p>
          </MagicCard>
        )}
      </div>
    </div>
  );
}
