import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useState } from "react";
import { ChevronRight, Check, Loader2, User } from "lucide-react"; // avatar uses iris image
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import irisAvatar from "@/assets/iris-avatar.png";
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

  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-muted-foreground/15 px-4 py-2.5 text-sm text-foreground">
          {message.content}
        </div>
        <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex gap-2">
      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full overflow-hidden mt-0.5">
        <img src={irisAvatar} alt="Iris" className="h-full w-full object-cover" />
      </div>
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
        {message.activeTools && message.activeTools.length > 0 && (
          <div className="space-y-1">
            {message.activeTools.map((tool) => (
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
        )}

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
