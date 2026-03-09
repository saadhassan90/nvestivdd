import { useEffect, useRef, useState } from "react";
import { X, SquarePen, History, ChevronDown, Check, Sparkles, Paperclip, ArrowUp, Loader2 } from "lucide-react";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatHistory } from "./ChatHistory";
import { ChatEmptyState } from "./ChatEmptyState";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "sonnet-4", label: "Sonnet 4", desc: "Default" },
  { id: "haiku-3.5", label: "Haiku 3.5", desc: "Fast" },
];

export function ChatSidebar() {
  const {
    isOpen, setIsOpen, messages, isLoading, sendMessage,
    startNewConversation, selectedModel, setSelectedModel,
    projectScope, setProjectScope, loadConversations,
  } = useChatContext();

  const [input, setInput] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
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

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Nvestiv AI</span>
        </div>

        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            {currentModel.label}
            <ChevronDown className="h-3 w-3" />
          </button>
          {showModelMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-card shadow-lg py-1">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setShowModelMenu(false); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs hover:bg-muted transition-colors"
                  >
                    <div>
                      <span className="font-medium text-foreground">{m.label}</span>
                      <span className="ml-1.5 text-muted-foreground">({m.desc})</span>
                    </div>
                    {selectedModel === m.id && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => { startNewConversation(); setShowHistory(false); }} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="New conversation">
            <SquarePen className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadConversations(); }} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="History">
            <History className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Scope pill */}
      {projectScope && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
            📎 {projectScope.name}
            <button onClick={() => setProjectScope(null)} className="hover:text-destructive ml-0.5">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Content */}
      {showHistory ? (
        <ChatHistory onBack={() => setShowHistory(false)} />
      ) : (
        <>
          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
            style={{ backgroundColor: "hsl(0 0% 98%)" }}
          >
            {messages.length === 0 ? (
              <ChatEmptyState
                onPrompt={(p) => {
                  setInput(p);
                  setTimeout(() => sendMessage(p), 0);
                }}
                isScoped={!!projectScope}
              />
            ) : (
              messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border bg-card px-4 py-3">
            <div className="flex items-end gap-2">
              <button className="shrink-0 p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground" title="Attach file">
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={projectScope ? "Ask about this deal..." : "Ask anything..."}
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                style={{ maxHeight: 144 }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "shrink-0 flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  input.trim() && !isLoading
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground opacity-50"
                )}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {currentModel.label} · {projectScope ? `Scoped to ${projectScope.name}` : "Global mode"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
