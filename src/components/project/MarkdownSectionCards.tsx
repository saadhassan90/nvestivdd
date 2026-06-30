import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";
import { parseMarkdownCards } from "@/lib/markdown-card-parser";
import { useSectionContext } from "@/contexts/SectionContext";
import { CardCommentThread } from "@/components/project/CardCommentThread";
import { slugify, cardDomId } from "@/lib/card-labels";

interface MarkdownSectionCardsProps {
  content: string | null;
  baseDelay?: number;
  /** Override card-id prefix; defaults to "md". Combined with slug(title). */
  cardIdPrefix?: string;
}

/**
 * Renders markdown as structured cards, one per heading section.
 * Drop-in replacement for ReportMarkdownSection with structured layout.
 */
export function MarkdownSectionCards({ content, baseDelay = 0.05, cardIdPrefix = "md" }: MarkdownSectionCardsProps) {
  if (!content) return null;

  const cards = parseMarkdownCards(content);
  const ctx = useSectionContext();

  if (cards.length === 0) return null;

  // Single untitled card — render as one section
  if (cards.length === 1 && !cards[0].title) {
    const cardId = `${cardIdPrefix}_root`;
    const domId = ctx ? cardDomId(ctx.sectionId, cardId) : undefined;
    return (
      <BlurFade delay={baseDelay}>
        <section id={domId} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-5 sm:p-6">
            <MarkdownContent content={cards[0].content} />
          </div>
          {ctx && (
            <CardCommentThread
              projectId={ctx.projectId}
              sectionId={ctx.sectionId}
              cardId={cardId}
              cardLabel="Section"
            />
          )}
        </section>
      </BlurFade>
    );
  }

  return (
    <div className="space-y-4">
      {cards.map((card, i) => {
        const slug = card.title ? slugify(card.title) : `${cardIdPrefix}_${i}`;
        const cardId = `${cardIdPrefix}_${slug}`;
        const domId = ctx ? cardDomId(ctx.sectionId, cardId) : undefined;
        return (
          <BlurFade key={i} delay={baseDelay + i * 0.03}>
            <section id={domId} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="p-5 sm:p-6">
                {card.title && (
                  <div className="mb-4 pb-3 border-b border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                      Section {i + 1}
                    </p>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                      {card.title}
                    </h3>
                  </div>
                )}
                {card.content && <MarkdownContent content={card.content} />}
              </div>
              {ctx && (
                <CardCommentThread
                  projectId={ctx.projectId}
                  sectionId={ctx.sectionId}
                  cardId={cardId}
                  cardLabel={card.title || `Section ${i + 1}`}
                />
              )}
            </section>
          </BlurFade>
        );
      })}
    </div>
  );
}
