import { useEffect, useRef, useState } from "react";
import { X, SquarePen, History, ChevronDown, Check, Paperclip, ArrowUp, Loader2 } from "lucide-react";
import irisAvatar from "@/assets/iris-avatar.png";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatHistory } from "./ChatHistory";
import { ChatEmptyState } from "./ChatEmptyState";
import { DotPattern } from "@/components/magicui/DotPattern";
import { cn } from "@/lib/utils";

const MODELS = [
{ id: "sonnet-4", label: "Sonnet 4", desc: "Default" },
{ id: "haiku-3.5", label: "Haiku 3.5", desc: "Fast" }];


export function ChatSidebar() {
  const {
    isOpen, setIsOpen, messages, isLoading, sendMessage,
    startNewConversation, selectedModel, setSelectedModel,
    projectScope, setProjectScope, loadConversations
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
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={irisAvatar} alt="Iris" className="h-5 w-5 rounded-full" />
            <span className="text-sm font-semibold text-foreground">Iris</span>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => {startNewConversation();setShowHistory(false);}} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="New conversation">
              <SquarePen className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => {setShowHistory(!showHistory);if (!showHistory) loadConversations();}} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="History">
              <History className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {projectScope &&
        <div className="flex items-center gap-2 px-4 pb-2.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Current context</span>
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

      <div className="relative flex-1 min-h-0">
          {/* Messages */}
          <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-auto px-4 pt-3 pb-28 space-y-3 bg-muted">
          
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


          messages.map((msg) =>
          <ChatMessageBubble key={msg.id} message={msg} />
          )
          }
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input */}
          <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
            <div className="pointer-events-auto rounded-2xl border border-border bg-card shadow-lg p-3">
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
                <button className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground" title="Attach file">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  input.trim() && !isLoading ?
                  "bg-foreground text-background" :
                  "bg-muted text-muted-foreground opacity-50"
                )}>
                
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
              {projectScope



            }
            </div>
          </div>
        </div>
      }
    </div>);

}