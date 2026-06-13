import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, SquarePen, Menu, ChevronDown, Check, Plus, ArrowUp, Square, Paperclip, FileText } from "lucide-react";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatHistory } from "./ChatHistory";
import { ChatEmptyState } from "./ChatEmptyState";
import { DotPattern } from "@/components/magicui/DotPattern";
import { cn } from "@/lib/utils";
import irisHelmet from "@/assets/iris-avatar-helmet.png";
import { ChatResizeHandle } from "./ChatResizeHandle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODELS = [
{ id: "sonnet-4", label: "Sonnet 4", desc: "Default" },
{ id: "haiku-3.5", label: "Haiku 3.5", desc: "Fast" }];

function getSuggestedPrompts(lastAssistantMsg: ChatMessage | undefined, isScoped: boolean): string[] {
  if (!lastAssistantMsg?.content) return [];
  const c = lastAssistantMsg.content.toLowerCase();

  const suggestions: string[] = [];

  if (c.includes("risk") || c.includes("flag"))
    suggestions.push("How can these risks be mitigated?", "Which risk is most critical?");
  if (c.includes("fee") || c.includes("expense") || c.includes("cost"))
    suggestions.push("How do these fees compare to market?", "Break down the fee waterfall");
  if (c.includes("score") || c.includes("rating"))
    suggestions.push("What's driving the score?", "How can the score improve?");
  if (c.includes("memo") || c.includes("summary") || c.includes("overview"))
    suggestions.push("Add more detail on track record", "What are the key concerns?");
  if (c.includes("term") || c.includes("structure"))
    suggestions.push("Are these terms market-standard?", "What terms should I negotiate?");

  // Always offer these general follow-ups
  if (suggestions.length < 3) {
    if (isScoped) {
      suggestions.push("Draft an IC memo for this deal", "What should I ask the GP?", "Compare to similar funds");
    } else {
      suggestions.push("Which deal needs attention first?", "Summarize my portfolio risks", "What deals should I avoid?");
    }
  }

  return suggestions.slice(0, 4);
}


export function ChatSidebar() {
  const {
    messages, isLoading, sendMessage,
    startNewConversation, selectedModel, setSelectedModel, stopGeneration,
    projectScope, setProjectScope, loadConversations
  } = useChatContext();

  const [input, setInput] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: number; type: string; text: string; isBinary: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if ((!msg && attachments.length === 0) || isLoading) return;
    let payload = msg;
    if (attachments.length > 0) {
      const blocks = attachments
        .map((a) => {
          if (a.isBinary) {
            return `--- Attached file: ${a.name} (${a.type || "binary"}, ${a.size} bytes) ---\n[Binary file — contents not inlined]`;
          }
          const truncated = a.text.length > 80_000 ? a.text.slice(0, 80_000) + "\n…[truncated]" : a.text;
          return `--- Attached file: ${a.name} (${a.type || "text"}) ---\n${truncated}`;
        })
        .join("\n\n");
      payload = msg ? `${msg}\n\n${blocks}` : blocks;
    }
    setInput("");
    setAttachments([]);
    setUserScrolled(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(payload);
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

  const isTextLike = (f: File) => {
    if (f.type.startsWith("text/")) return true;
    if (/(json|xml|javascript|typescript|csv|yaml|html|svg|sql|markdown)/i.test(f.type)) return true;
    return /\.(txt|md|markdown|csv|tsv|json|yaml|yml|xml|html|htm|css|scss|js|jsx|ts|tsx|py|rb|go|rs|java|kt|swift|c|cc|cpp|h|hpp|sh|bash|zsh|sql|toml|ini|env|log|svg)$/i.test(f.name);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const parsed = await Promise.all(
      list.map(async (f) => {
        const textLike = isTextLike(f);
        let text = "";
        if (textLike) {
          try { text = await f.text(); } catch { text = ""; }
        }
        return {
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type,
          text,
          isBinary: !textLike,
        };
      })
    );
    setAttachments((prev) => [...prev, ...parsed]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const lastAssistantMsg = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant" && m.content && !m.isStreaming),
    [messages]
  );
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(lastAssistantMsg, !!projectScope),
    [lastAssistantMsg, projectScope]
  );

  return (
    <div data-chat-drawer className="relative flex flex-col h-full w-full bg-card border-r border-border">
      <ChatResizeHandle />
      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => {setShowHistory(!showHistory);if (!showHistory) loadConversations();}} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="History">
              <Menu className="h-4 w-4 text-muted-foreground" />
            </button>
            <img src={irisHelmet} alt="Iris" className="h-6 w-6 rounded-full object-cover" />
            <span className="text-sm font-semibold text-foreground">Ask Iris</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => {startNewConversation();setShowHistory(false);}} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="New conversation">
              <SquarePen className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {projectScope &&
        <div className="flex items-center gap-2 px-4 pb-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Context</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
              📎 {projectScope.name}
              <button onClick={() => setProjectScope(null)} className="hover:text-destructive ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        }
      </div>

      {/* Content */}
      {showHistory ?
      <ChatHistory onBack={() => setShowHistory(false)} /> :

      <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Messages */}
          <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-3 bg-muted">
          
            <DotPattern
            className="fill-muted-foreground/10"
            style={{ mask: "radial-gradient(ellipse at center, black 20%, transparent 70%)", WebkitMask: "radial-gradient(ellipse at center, black 20%, transparent 70%)" } as React.CSSProperties} />
          
            {messages.length === 0 ?
          <ChatEmptyState
            onPrompt={(p) => {
              setInput(p);
              setTimeout(() => sendMessage(p), 0);
            }}
            isScoped={!!projectScope} /> :


          messages.map((msg, i) => {
            const prev = messages[i - 1];
            const sameRole = prev && prev.role === msg.role;
            return (
              <div key={msg.id} className={sameRole ? "mt-2" : prev ? "mt-5" : ""}>
                <ChatMessageBubble message={msg} />
              </div>
            );
          })
          }
            {isLoading && (() => {
              const last = messages[messages.length - 1];
              const showPulse = !last || last.role === "user" || (last.role === "assistant" && !last.content);
              return showPulse ? <div className="mt-5"><NvestivPulse /></div> : null;
            })()}
            <div ref={messagesEndRef} />
          </div>

          {/* Input dock (in-flow so messages can't slide underneath) */}
            <div className="shrink-0 p-3 bg-muted border-t border-transparent">
              {/* Suggested follow-up prompts */}
              {suggestedPrompts.length > 0 && !isLoading && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setInput(prompt);
                        setUserScrolled(false);
                        setTimeout(() => sendMessage(prompt), 0);
                      }}
                      className="shrink-0 rounded-full border border-[hsl(var(--nvestiv-teal))] bg-card/80 backdrop-blur-sm px-3 py-1.5 text-[11px] text-[hsl(var(--nvestiv-teal))] hover:bg-[hsl(var(--nvestiv-teal)/0.08)] transition-colors whitespace-nowrap"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            <div className="rounded-2xl border border-border bg-card shadow-lg p-3">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {attachments.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-[11px] text-foreground max-w-[220px]"
                      title={a.name}
                    >
                      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{a.name}</span>
                      <button
                        onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                        className="hover:text-destructive shrink-0"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={projectScope ? "Ask about this deal..." : "Ask anything..."}
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ maxHeight: 144 }} />
            
              <div className="flex items-center justify-between mt-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                      title="Add to chat"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-48">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach file
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                onClick={isLoading ? stopGeneration : handleSend}
                disabled={!isLoading && !input.trim() && attachments.length === 0}
                title={isLoading ? "Stop generating" : "Send"}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  isLoading
                    ? "bg-foreground text-background"
                    : input.trim() || attachments.length > 0
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground opacity-50"
                )}>
                
                  {isLoading ? <Square className="h-3 w-3 fill-current" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            
            </div>
          </div>
        </div>
      }
    </div>);

}