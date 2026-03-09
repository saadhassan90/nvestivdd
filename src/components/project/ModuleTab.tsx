import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { ScoreBadge } from "@/components/dashboard/ScoreBadge";
import { Lock } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/ShimmerButton";
import ReactMarkdown from "react-markdown";
import type { Tables } from "@/integrations/supabase/types";

interface ModuleTabProps {
  sections: Tables<"report_sections">[];
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const MODULES = [
  { key: "module_a", letter: "A", name: "Fund Strategy & Terms" },
  { key: "module_b", letter: "B", name: "Track Record & Performance" },
  { key: "module_c", letter: "C", name: "Team & Governance" },
  { key: "module_d", letter: "D", name: "Portfolio & Risk" },
  { key: "module_e", letter: "E", name: "Operations & Compliance" },
];

export function ModuleTab({ sections, activeModule, onModuleChange }: ModuleTabProps) {
  const section = sections.find(s => s.section_key === activeModule);
  const currentModule = MODULES.find(m => m.key === activeModule);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Module selector — horizontal scroll on mobile, vertical sidebar on desktop */}
      <div className="lg:w-56 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 hidden lg:block">Project Modules</p>

        {/* Mobile: horizontal pills */}
        <div className="lg:hidden overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-2">
            {MODULES.map((mod) => {
              const isActive = activeModule === mod.key;
              return (
                <button
                  key={mod.key}
                  onClick={() => onModuleChange(mod.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Module {mod.letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: vertical list */}
        <div className="hidden lg:block space-y-1">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.key;
            return (
              <button
                key={mod.key}
                onClick={() => onModuleChange(mod.key)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Module {mod.letter}: {mod.name}
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
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Comprehensive project assessment and risk evaluation.</p>
            </div>
            {section?.score && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Score</span>
                <ScoreBadge score={section.score} size="md" />
              </div>
            )}
          </div>
        </BlurFade>

        {section?.content ? (
          <BlurFade delay={0.1}>
            <MagicCard>
              <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground overflow-x-auto">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </MagicCard>
          </BlurFade>
        ) : (
          <MagicCard>
            <p className="text-sm text-muted-foreground text-center py-8">No analysis content available for this module yet.</p>
          </MagicCard>
        )}

        {section && (
          <BlurFade delay={0.2}>
            <div className="flex items-center gap-6 sm:gap-8">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Rating</span>
                <p className="text-sm font-medium text-foreground mt-0.5">Low (0.12)</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verification</span>
                <p className="text-sm font-medium text-foreground mt-0.5">Verified (99.5%)</p>
              </div>
            </div>
          </BlurFade>
        )}

        <BlurFade delay={0.3}>
          <MagicCard>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm sm:text-base">Requires Data Room Access</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  To view detailed financial projections and legal documentation, your account must have active Data Room privileges.
                </p>
                <div className="mt-3">
                  <ShimmerButton className="text-xs">Request Access</ShimmerButton>
                </div>
              </div>
            </div>
          </MagicCard>
        </BlurFade>
      </div>
    </div>
  );
}
