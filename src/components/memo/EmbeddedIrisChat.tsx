import { useEffect, useMemo, useRef, useState } from "react";
import { SquarePen, Menu, Paperclip, ArrowUp, Loader2, X } from "lucide-react";
import irisAvatar from "@/assets/iris-avatar.png";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { DotPattern } from "@/components/magicui/DotPattern";
import { cn } from "@/lib/utils";

const MEMO_PROMPTS = [
  "Tighten the executive summary",
  "Draft the recommendation paragraph",
  "Pull the fee table into Fees & Terms",
  "Add mitigants column to Risks",
];

/**
 * Embedded Iris chat for the IC Memo workspace.
 * Reuses the ChatProvider state but renders inline (not as a fixed drawer).
 * The close button is omitted because the chat is permanent here.
 */
export function EmbeddedIrisChat({ fundName }: { fundName: string }) {
  const {
    messages,
    isLoading,
    sendMessage,
    startNewConversation,
    projectScope,
    setProjectScope,
    loadConversations,
  } = useChatContext();

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  useEffect(() => {
    if (!userScrolled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userScrolled]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setUserScrolled(!atBottom);
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    setUserScrolled(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  };

  const lastAssistantMsg = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant" && m.content && !m.isStreaming),
    [messages],
  );

  return (
    <div className="flex flex-col h-full w-full bg-card border-l border-border">
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) loadConversations();
              }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="History"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            <img src={irisAvatar} alt="Iris" className="h-5 w-5 rounded-full" />
            <span className="text-sm font-semibold text-foreground">Ask Iris</span>
            <span className="ml-1 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Memo
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                startNewConversation();
                setShowHistory(false);
              }}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="New conversation"
            >
              <SquarePen className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {projectScope && (
          <div className="flex items-center gap-2 px-4 pb-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Co-authoring
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
              📝 {projectScope.name}
              <button onClick={() => setProjectScope(null)} className="hover:text-destructive ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {showHistory ? (
        <ChatHistory onBack={() => setShowHistory(false)} />
      ) : (
        <div className="relative flex-1 min-h-0">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto px-4 pt-3 pb-32 space-y-3 bg-muted"
          >
            <DotPattern
              className="fill-muted-foreground/10"
              style={
                {
                  mask: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                  WebkitMask: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                } as React.CSSProperties
              }
            />

            {messages.length === 0 ? (
              <div className="relative z-10 flex flex-col items-center justify-center text-center pt-12 px-4">
                <img src={irisAvatar} alt="Iris" className="h-12 w-12 rounded-full mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Co-author the {fundName} memo
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-[260px]">
                  Ask Iris to draft, tighten, or restructure any section. Edits land directly in the canvas.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {MEMO_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setInput(p);
                        setUserScrolled(false);
                        setTimeout(() => sendMessage(p), 0);
                      }}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating input */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
            {messages.length > 0 && !isLoading && (
              <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
                {MEMO_PROMPTS.slice(0, 3).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      setUserScrolled(false);
                      setTimeout(() => sendMessage(prompt), 0);
                    }}
                    className="shrink-0 rounded-full border border-border bg-card/80 backdrop-blur-sm px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="pointer-events-auto rounded-2xl border border-border bg-card shadow-lg p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Edit, draft, or refine the memo…"
                rows={1}
                className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ maxHeight: 144 }}
              />
              <div className="flex items-center justify-between mt-1.5">
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    input.trim() && !isLoading
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground opacity-50",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}