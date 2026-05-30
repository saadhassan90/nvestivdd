import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useState } from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/contexts/ChatContext";

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

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted-foreground/15 px-4 py-2.5 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

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

        {/* Content */}
        {message.content && (
          <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-p:text-[13px] prose-p:leading-relaxed prose-li:text-[13px] prose-code:text-[12px] prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-table:text-[12px] prose-th:text-[10px] prose-th:uppercase prose-th:tracking-wider prose-th:text-muted-foreground prose-th:font-semibold prose-th:border-b prose-th:border-border prose-td:border-b prose-td:border-border prose-strong:text-foreground prose-a:text-foreground prose-a:underline prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* No inline cursor — the standalone pulse below the thread covers
            thinking/streaming states. */}
      </div>
    </div>
  );
}
