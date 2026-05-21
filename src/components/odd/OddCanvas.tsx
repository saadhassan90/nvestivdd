import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { ODD_SECTIONS, type OddSectionKey } from "@/lib/odd-template";
import { MarkdownContent } from "@/components/project/MarkdownContent";
import { OddSectionSkeleton } from "./OddSectionSkeleton";

export type OddSectionRuntimeStatus = "pending" | "running" | "complete" | "error";

export interface OddSectionState {
  status: OddSectionRuntimeStatus;
  content: string | null;
  errorMessage?: string | null;
}

interface OddCanvasProps {
  fundName: string;
  sections: Record<OddSectionKey, OddSectionState>;
  onRetrySection?: (key: OddSectionKey) => void;
  onSectionEdit?: (key: OddSectionKey, markdown: string) => void;
  /** Bumped externally to register a programmatic scroll target. */
  onRegisterScroll?: (scrollFn: (key: OddSectionKey) => void) => void;
  onActiveSectionChange?: (key: OddSectionKey | null) => void;
}

export function OddCanvas({
  fundName,
  sections,
  onRetrySection,
  onSectionEdit,
  onRegisterScroll,
  onActiveSectionChange,
}: OddCanvasProps) {
  const sectionRefs = useRef<Partial<Record<OddSectionKey, HTMLDivElement | null>>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onRegisterScroll?.((key) => {
      const el = sectionRefs.current[key];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [onRegisterScroll]);

  // Track visible section based on scroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !onActiveSectionChange) return;
    const onScroll = () => {
      const top = scroller.getBoundingClientRect().top;
      let active: OddSectionKey | null = null;
      for (const s of ODD_SECTIONS) {
        const el = sectionRefs.current[s.key];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top - top <= 120) active = s.key;
      }
      onActiveSectionChange(active);
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [onActiveSectionChange]);

  return (
    <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[820px] px-6 sm:px-10 py-10">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
          {fundName}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">Operational Due Diligence Report</p>

        {ODD_SECTIONS.map((s) => {
          const state = sections[s.key];
          return (
            <section
              key={s.key}
              id={`odd-section-${s.key}`}
              ref={(el) => {
                sectionRefs.current[s.key] = el;
              }}
              className="mb-10 scroll-mt-6"
            >
              <h2 className="text-lg font-semibold text-foreground tracking-tight mb-3 pb-1 border-b border-border">
                {s.title}
              </h2>

              {state?.status === "complete" && state.content ? (
                <EditableSection
                  initial={state.content}
                  onChange={(md) => onSectionEdit?.(s.key, md)}
                />
              ) : state?.status === "error" ? (
                <ErrorBlock
                  message={state.errorMessage || "Generation failed"}
                  onRetry={onRetrySection ? () => onRetrySection(s.key) : undefined}
                />
              ) : (
                <OddSectionSkeleton />
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EditableSection({
  initial,
  onChange,
}: {
  initial: string;
  onChange: (md: string) => void;
}) {
  // V1: rendered markdown is read-only; the analyst edits via Iris in the right rail
  // or via direct editing once we wire BlockNote per-section. This component is the
  // future hook-point.
  void onChange;
  return <MarkdownContent content={initial} />;
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-severity-critical/40 bg-severity-critical/5 px-3 py-2.5 text-sm">
      <span className="text-severity-critical font-medium">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:underline"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );
}