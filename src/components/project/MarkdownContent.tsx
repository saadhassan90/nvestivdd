import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-sm max-w-none
      prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
      prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
      prose-h4:text-sm prose-h4:mt-4 prose-h4:mb-2
      prose-p:text-default-600 prose-p:leading-relaxed prose-p:text-[13px]
      prose-strong:text-foreground prose-strong:font-semibold
      prose-li:text-default-600 prose-li:text-[13px] prose-li:my-0.5
      prose-ul:my-2 prose-ol:my-2
      prose-table:text-[12px] prose-table:border-separate prose-table:border-spacing-0 prose-table:w-full
      prose-thead:bg-default-50
      prose-th:text-foreground prose-th:font-semibold prose-th:text-[11px] prose-th:uppercase prose-th:tracking-wider
      prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-default-200 prose-th:text-left
      prose-td:text-default-600 prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-default-200
      prose-tr:border-default-200
      prose-hr:border-default-200 prose-hr:my-6
      prose-a:text-primary prose-a:underline-offset-2
      overflow-x-auto
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
