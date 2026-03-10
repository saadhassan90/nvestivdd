import { BlurFade } from "@/components/magicui/BlurFade";
import { MarkdownContent } from "@/components/project/MarkdownContent";

interface ReportMarkdownSectionProps {
  content: string | null;
  delay?: number;
}

/**
 * Renders combined markdown sections from the L1 report as a continuous,
 * report-style analytical document. Uses prose styling for readability.
 */
export function ReportMarkdownSection({ content, delay = 0 }: ReportMarkdownSectionProps) {
  if (!content) return null;

  return (
    <BlurFade delay={delay}>
      <div className="rounded-xl border border-border bg-card p-5 sm:p-8">
        <MarkdownContent content={content} />
      </div>
    </BlurFade>
  );
}
