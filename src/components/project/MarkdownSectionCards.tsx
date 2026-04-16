import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";
import { parseMarkdownCards } from "@/lib/markdown-card-parser";

interface MarkdownSectionCardsProps {
  content: string | null;
  baseDelay?: number;
}

/**
 * Renders markdown as structured cards, one per heading section.
 * Drop-in replacement for ReportMarkdownSection with structured layout.
 */
export function MarkdownSectionCards({ content, baseDelay = 0.05 }: MarkdownSectionCardsProps) {
  if (!content) return null;

  const cards = parseMarkdownCards(content);

  if (cards.length === 0) return null;

  // Single untitled card — render as one section
  if (cards.length === 1 && !cards[0].title) {
    return (
      <BlurFade delay={baseDelay}>
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <MarkdownContent content={cards[0].content} />
        </div>
      </BlurFade>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <BlurFade key={i} delay={baseDelay + i * 0.03}>
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            {card.title && (
              <div className="mb-4 pb-3 border-b border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Section {i + 1}
                </p>
                <h3 className="text-sm font-bold text-foreground tracking-tight">
                  {card.title}
                </h3>
              </div>
            )}
            {card.content && <MarkdownContent content={card.content} />}
          </div>
        </BlurFade>
      ))}
    </div>
  );
}
