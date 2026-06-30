import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useState, type ReactNode } from "react";
import { ChevronRight, Check, Loader2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { CodeBlock } from "./CodeBlock";
import { InteractiveQuickReply } from "./InteractiveQuickReply";
import { InteractiveForm, type FormField } from "./InteractiveForm";
import { AnimatedChartRender } from "@/components/memo/blocks/AnimatedChartBlock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOOL_LABELS: Record<string, string> = {
  query_deal_scores: "Querying deal scores",
  query_module_scores: "Reviewing module scores",
  query_team_members: "Analyzing team members",
  query_service_providers: "Checking service providers",
  query_performance_metrics: "Pulling performance metrics",
  query_fee_structure: "Reviewing fee structure",
  query_exits: "Analyzing realized exits",
  query_thesis_validations: "Validating thesis claims",
  query_competitive_landscape: "Mapping competitors",
  query_market_factors: "Assessing market dynamics",
  query_red_flags: "Searching red flags",
  query_critical_gaps: "Identifying info gaps",
  query_interrogatory: "Checking interrogatory items",
  query_data_room: "Reviewing data room",
  query_report_section: "Reading report section",
  query_research_sources: "Searching research sources",
  query_cross_deal: "Comparing deals",
  query_documents: "Listing documents",
  search_documents: "Knowledge graph search",
};

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const { submitInteractive } = useChatContext();

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted-foreground/15 px-4 py-2.5 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const isComplete = !!message.content && !message.isStreaming && !message.isThinking;
  // Markdown component overrides — proper shadcn tables, CodeBlock with copy,
  // and inline animated chart fences.
  const mdComponents = {
    a: (props: any) => (
      <a {...props} target="_blank" rel="noreferrer" className="underline text-foreground" />
    ),
    table: (props: any) => (
      <div className="not-prose my-2 overflow-x-auto rounded-lg border border-border">
        <Table>{props.children}</Table>
      </div>
    ),
    thead: (props: any) => <TableHeader>{props.children}</TableHeader>,
    tbody: (props: any) => <TableBody>{props.children}</TableBody>,
    tr: (props: any) => <TableRow>{props.children}</TableRow>,
    th: (props: any) => (
      <TableHead className="h-8 px-2 text-[10px]">
        {props.children}
      </TableHead>
    ),
    td: (props: any) => <TableCell className="px-2 py-1.5 text-[12px]">{props.children}</TableCell>,
    code: (props: any) => {
      const { inline, className, children } = props;
      const lang = /language-(\w+)/.exec(className || "")?.[1];
      if (inline) {
        return (
          <code className="rounded bg-muted px-1 py-0.5 text-[11.5px] font-mono">
            {children}
          </code>
        );
      }
      if (lang === "chart") {
        const text = String(children).trim();
        try {
          const spec = JSON.parse(text);
          return (
            <AnimatedChartRender
              spec={{
                type: spec.type || "bar",
                title: spec.title,
                subtitle: spec.subtitle,
                xLabel: spec.xLabel,
                yLabel: spec.yLabel,
                data: Array.isArray(spec.data) ? spec.data : [],
                palette: spec.palette === "signal" ? "signal" : "mono",
              }}
              height={220}
            />
          );
        } catch {
          return <CodeBlock language="chart">{text}</CodeBlock>;
        }
      }
      return <CodeBlock language={lang}>{children as ReactNode}</CodeBlock>;
    },
    pre: (props: any) => <>{props.children}</>,
  } as const;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // Assistant message
  return (
    <div className="flex">
      <div className="flex-1 min-w-0 space-y-2">
        {/* Thinking block */}
        {(message.isThinking || message.thinkingContent) && (
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            <button
              onClick={() => setThinkingOpen(!thinkingOpen)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs"
            >
              <ChevronRight className={cn("h-3 w-3 transition-transform text-muted-foreground", thinkingOpen && "rotate-90")} />
              {message.isThinking ? (
                <span className="font-medium text-muted-foreground animate-pulse">⚡ Thinking...</span>
              ) : (
                <span className="text-muted-foreground">💭 Thought for {message.thinkingDuration || "?"}s</span>
              )}
            </button>
            {thinkingOpen && (
              <div className="border-t border-border border-l-2 border-l-muted-foreground/40 mx-3 mb-3 mt-0 pl-3 py-2 max-h-48 overflow-y-auto">
                <pre className="text-[11px] leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap break-words">
                  {message.thinkingContent}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Content (shown above steps so the assistant says what it's doing first) */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-h1:mt-3 prose-h1:mb-1.5 prose-h2:mt-3 prose-h2:mb-1.5 prose-h3:mt-2.5 prose-h3:mb-1 prose-p:text-[13px] prose-p:leading-snug prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:text-[13px] prose-li:my-0.5 prose-li:leading-snug prose-hr:my-3 prose-blockquote:my-2 prose-strong:text-foreground prose-a:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as any}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Interactive clarification UI from ask_quick_reply / ask_form */}
        {message.interactive && message.interactive.kind === "chips" && (
          <InteractiveQuickReply
            question={message.interactive.input?.question}
            options={message.interactive.input?.options || []}
            answered={message.interactive.answered}
            onPick={(val) =>
              submitInteractive(message.id, { kind: "chips", values: val })
            }
          />
        )}
        {message.interactive && message.interactive.kind === "form" && (
          <InteractiveForm
            title={message.interactive.input?.title}
            submitLabel={message.interactive.input?.submitLabel}
            fields={(message.interactive.input?.fields || []) as FormField[]}
            answered={message.interactive.answered}
            onSubmit={(values) =>
              submitInteractive(message.id, { kind: "form", values })
            }
          />
        )}

        {/* Tool use indicators */}
        {message.activeTools && message.activeTools.length > 0 && (() => {
          const tools = message.activeTools;
          const anyExecuting = tools.some((t) => t.status === "executing");
          // While running, show live steps. Once complete, collapse into an accordion.
          if (anyExecuting) {
            return (
              <div className="space-y-1">
                {tools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-2 border-l-2 border-border pl-2.5 py-0.5">
                    {tool.status === "executing" ? (
                      <Loader2 className="h-3 w-3 text-muted-foreground animate-spin shrink-0" />
                    ) : (
                      <Check className="h-3 w-3 text-score-strong shrink-0" />
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {tool.status === "executing"
                        ? `🔍 ${TOOL_LABELS[tool.name] || tool.name}...`
                        : `✓ ${TOOL_LABELS[tool.name] || tool.name} — ${tool.resultSummary || "done"}`}
                    </span>
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <button
                onClick={() => setToolsOpen((o) => !o)}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform duration-200",
                    toolsOpen && "rotate-90"
                  )}
                />
                <Check className="h-3 w-3 text-score-strong shrink-0" />
                <span className="text-muted-foreground">
                  {tools.length} {tools.length === 1 ? "step" : "steps"} taken
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200 ease-out",
                  toolsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 px-3 pb-3 pt-1 border-t border-border">
                    {tools.map((tool) => (
                      <div key={tool.id} className="flex items-center gap-2 border-l-2 border-border pl-2.5 py-0.5">
                        <Check className="h-3 w-3 text-score-strong shrink-0" />
                        <span className="text-[11px] text-muted-foreground">
                          ✓ {TOOL_LABELS[tool.name] || tool.name}
                          {tool.resultSummary ? ` — ${tool.resultSummary}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* No inline cursor — the standalone pulse below the thread covers
            thinking/streaming states. */}

        {/* Response actions (copy + feedback) */}
        {isComplete && (
          <div className="flex items-center gap-1 pt-1 -ml-1">
            <button
              onClick={handleCopy}
              title={copied ? "Copied" : "Copy"}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-score-strong" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              title="Good response"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                feedback === "up" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", feedback === "up" && "fill-current")} />
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              title="Bad response"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                feedback === "down" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsDown className={cn("h-3.5 w-3.5", feedback === "down" && "fill-current")} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
