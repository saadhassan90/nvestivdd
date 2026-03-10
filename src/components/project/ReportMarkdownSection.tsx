import { MagicCard } from "@/components/magicui/MagicCard";
import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";

interface ReportMarkdownSectionProps {
  content: string | null;
  delay?: number;
}

/**
 * Renders a full markdown section from the L1 report inside a card.
 * Used by all tab components to display unstructured report content.
 */
export function ReportMarkdownSection({ content, delay = 0 }: ReportMarkdownSectionProps) {
  if (!content) return null;

  return (
    <BlurFade delay={delay}>
      <MagicCard>
        <MarkdownContent content={content} />
      </MagicCard>
    </BlurFade>
  );
}
