# Ask Iris — Chat Widget Specification

This document is the **single source of truth** for the Ask Iris chat widget.
It is self-contained: pasting it into a fresh prompt (with the listed
dependencies installed) is enough to recreate the widget exactly as it
ships today. All future changes to the chat widget MUST be reflected here.

---

## 1. Purpose & Scope

A right-side, resizable, dockable AI assistant ("Ask Iris") used inside an
investment-diligence app. It supports:

- Streaming assistant responses (SSE) from a Supabase edge function
  `chat-completion`, with separate streams for `thinking_*`, `content_delta`,
  `tool_start` / `tool_executing` / `tool_complete`, `message_complete`,
  `error`.
- Conversation persistence in two Supabase tables: `chat_conversations` and
  `chat_messages`.
- A project / memo / ODD scope chip ("Context") that pins the question to
  a specific deal.
- A history pane (grouped Today / Yesterday / Previous 7 Days / Older).
- An empty state with suggested prompts (scoped vs. global variants).
- Suggested follow-up prompts derived from the last assistant message.
- Drag-to-resize from the left edge, capped at 50% of viewport width
  (min 360 px, default 420 px, persisted to `localStorage` key `chatWidth`).
- A `chatExpanded` boolean (`chatWidth > 460`) that the surrounding app
  layout uses to collapse its left sidebar when the chat is enlarged.

## 2. Dependencies

- React 18, TypeScript 5, Vite 5
- Tailwind CSS v3 with the `@tailwindcss/typography` plugin (the assistant
  bubble relies on `prose prose-sm` overrides).
- `lucide-react` icons: `X, SquarePen, Menu, ChevronDown, ChevronRight,
  Check, Paperclip, ArrowUp, Square, Copy, ThumbsUp, ThumbsDown, Loader2,
  ArrowLeft, Trash2`.
- `react-markdown` + `remark-gfm`.
- `date-fns` (`formatDistanceToNow`).
- `@supabase/supabase-js` exposed as `@/integrations/supabase/client`.
- Local helpers expected to exist:
  - `@/components/ui/NvestivPulse` — thinking pulse indicator.
  - `@/components/magicui/DotPattern` — faint background dot pattern.
  - `@/lib/utils` exporting `cn` (clsx + tailwind-merge).
- Image assets: `@/assets/iris-avatar-helmet.png`, `@/assets/iris-hero.png`.

## 3. Design Tokens

All colors come from semantic Tailwind tokens (HSL) — **never** hard-coded:
`background, foreground, card, muted, muted-foreground, border, primary,
destructive`, plus app-specific tokens `--nvestiv-teal` and
`--score-strong`. The palette is monochrome cool-gray (HSL hue 220). The
only chromatic accent inside the chat is the Nvestiv teal used for the
suggested-prompt chip border and text.

## 4. Files

The widget is exactly **five files** (excluding the two tiny UI helpers
above). Their full source is embedded in §10.

| Path | Role |
| --- | --- |
| `src/contexts/ChatContext.tsx` | Provider, state, SSE streaming, persistence, resize state |
| `src/components/chat/ChatSidebar.tsx` | Drawer shell, header, resize handle, messages list, suggested prompts, input dock |
| `src/components/chat/ChatMessageBubble.tsx` | User + assistant bubble, thinking accordion, tool steps, copy/feedback actions |
| `src/components/chat/ChatHistory.tsx` | Grouped conversation history pane |
| `src/components/chat/ChatEmptyState.tsx` | Hero + suggested first prompts |

## 5. Layout Rules

- Drawer: `flex flex-col h-full w-full bg-card border-l border-border`,
  marked with `data-chat-drawer` so the resize handler can read its width.
- **Resize handle:** absolute on `left-0 top-0 bottom-0 z-50 w-1.5
  -translate-x-1/2 cursor-col-resize`. Visible grip is a centered
  `h-12 w-1 rounded-full bg-border group-hover:bg-foreground/40`.
- **Header:** `border-b border-border bg-card shrink-0`. Left cluster:
  history menu button, Iris avatar (`h-6 w-6 rounded-full`), "Ask Iris"
  label. Right cluster: new-conversation button, close button. Buttons are
  `p-1.5 rounded-md hover:bg-muted` with `h-4 w-4 text-muted-foreground`
  icons.
- **Context chip row** (only when `projectScope` is set): label reads
  `Context` (uppercase, `text-[10px] tracking-wider
  text-muted-foreground`), followed by a `rounded-full bg-muted px-2.5
  py-0.5 text-[11px]` chip with the deal name and an inline `X` button
  that clears `projectScope`.
- **Body:** when history is open → `ChatHistory`. Otherwise a flex column
  with two children:
  1. `relative flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-3 bg-muted`
     containing the `DotPattern` background, messages, and a
     `messagesEndRef` sentinel.
  2. **Input dock** (`shrink-0 p-3 bg-muted border-t border-transparent`).
     The transparent top border is intentional — it reserves the visual
     separation without drawing a line. The dock is **in-flow** so chat
     content can never slide underneath it.
- **Suggested prompts** sit immediately above the textarea card, in a
  single-row horizontal scroller, styled as pill buttons with the
  Nvestiv-teal border/text.
- **Textarea card:** `rounded-2xl border border-border bg-card shadow-lg
  p-3`. Textarea is `resize-none`, auto-grows up to 144 px. Footer row:
  paperclip on the left, circular send/stop button on the right
  (`h-8 w-8 rounded-full bg-foreground text-background`; disabled state
  uses `bg-muted text-muted-foreground opacity-50`).

## 6. Message Bubble Rules

- **User:** right-aligned, `max-w-[85%] rounded-2xl rounded-br-md
  bg-muted-foreground/15 px-4 py-2.5 text-sm`.
- **Assistant:** full width, vertical stack with `space-y-2` containing:
  1. **Thinking accordion** (when `isThinking` or `thinkingContent`):
     collapsed by default. Header is a `ChevronRight` + `⚡ Thinking…`
     (animated pulse) or `💭 Thought for {n}s`. Body is monospaced,
     muted, scroll-capped at `max-h-48`.
  2. **Markdown content** — rendered with `react-markdown` + `remark-gfm`
     and the exact long `prose ...` class string in §10. **Order is
     critical: content renders ABOVE the tool steps** so the assistant
     states its answer first, then shows the steps it took.
  3. **Tool steps:** while any tool is `executing`, render a live list
     with `Loader2` spinners and `🔍` labels. Once all tools finish,
     collapse into a single accordion row reading `{N} step(s) taken`.
     Tool labels come from the `TOOL_LABELS` map in
     `ChatMessageBubble.tsx` (keep the emojis: 🔍 for executing, ✓ for
     complete).
  4. **Response actions** (only when `isComplete`): copy button (becomes
     a `Check` for 1.5 s after copy), thumbs-up, thumbs-down. All three
     are `h-7 w-7 rounded-md text-muted-foreground` toggles.
- **Streaming pulse:** when the last message is a user message, or the
  assistant placeholder is empty, render a standalone `<NvestivPulse />`
  below the thread (not inside the bubble).

## 7. Spacing Between Messages

Inside the messages list, each `ChatMessageBubble` is wrapped in a div
with: `mt-2` if the previous message has the same role; `mt-5` if the
previous message has a different role; nothing for the first message.
Two-tier spacing: small gap within a turn, larger gap when the speaker
changes.

## 8. Suggested Prompts Logic

`getSuggestedPrompts` (in `ChatSidebar.tsx`) inspects the last completed
assistant message and appends 1–2 follow-ups per matched keyword family
(risk / fees / score / memo / terms). It back-fills with generic scoped
or global prompts until 3–4 are returned. Returns `[]` when there is no
completed assistant message.

## 9. Backend Contract

- Edge function URL: `${VITE_SUPABASE_URL}/functions/v1/chat-completion`,
  authorized with `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Request body:
  ```ts
  {
    messages: { role, content }[],  // last 20 + the new user turn
    model: string,                  // selectedModel
    project_id: string | null,
    conversation_id: string | null,
    memo_id: string | null,
    odd_project_id: string | null,
  }
  ```
- Response: SSE. Each event is `event: <type>\ndata: <json>\n\n`. Event
  types and the reducer that mutates the assistant message live in
  `ChatContext.tsx` `sendMessage`. **Do not change event names or the
  reducer without updating this spec.**
- Persistence: a `chat_conversations` row is created on the first user
  message (title = first 60 chars). Every user message is inserted into
  `chat_messages`. Assistant messages are persisted by the edge function,
  not by the client.

## 10. Full Source

The five files below are the complete, current implementation. Reproduce
them verbatim.

### 10.1 `src/contexts/ChatContext.tsx`

```tsx
import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  thinkingContent?: string;
  toolCalls?: { name: string; input: any; output: any }[];
  isStreaming?: boolean;
  isThinking?: boolean;
  thinkingDuration?: number;
  activeTools?: { name: string; id: string; status: "executing" | "complete"; resultSummary?: string }[];
};

type ChatContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  chatWidth: number;
  setChatWidth: (width: number) => void;
  chatExpanded: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  conversationId: string | null;
  projectScope: { id: string; name: string } | null;
  setProjectScope: (scope: { id: string; name: string } | null) => void;
  memoContext: { memoId: string } | null;
  setMemoContext: (ctx: { memoId: string } | null) => void;
  oddContext: { projectId: string } | null;
  setOddContext: (ctx: { projectId: string } | null) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  conversations: { id: string; title: string; created_at: string; project_id: string | null }[];
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  stopGeneration: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

export function useOptionalChatContext() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatWidth, setChatWidthState] = useState<number>(() => {
    if (typeof window === "undefined") return 420;
    const raw = window.localStorage.getItem("chatWidth");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 360 ? n : 420;
  });
  const setChatWidth = useCallback((w: number) => {
    setChatWidthState(w);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatWidth", String(Math.round(w)));
    }
  }, []);
  const chatExpanded = chatWidth > 460;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [projectScope, setProjectScope] = useState<{ id: string; name: string } | null>(null);
  const [memoContext, setMemoContext] = useState<{ memoId: string } | null>(null);
  const [oddContext, setOddContext] = useState<{ projectId: string } | null>(null);
  const [selectedModel, setSelectedModel] = useState("sonnet-4");
  const [conversations, setConversations] = useState<any[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, created_at, project_id")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("chat_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationId === id) startNewConversation();
  }, [conversationId, startNewConversation]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming || m.isThinking ? { ...m, isStreaming: false, isThinking: false } : m)),
    );
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at");
    if (data) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content || "",
          thinkingContent: m.thinking_content || undefined,
          toolCalls: m.tool_calls as any || undefined,
        }))
      );
      setConversationId(id);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;
      setIsLoading(true);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };

      setMessages((prev) => [...prev, userMsg]);

      // Create or reuse conversation
      let convId = conversationId;
      if (!convId) {
        const title = content.length > 60 ? content.slice(0, 57) + "..." : content;
        const { data } = await supabase
          .from("chat_conversations")
          .insert({
            title,
            project_id: projectScope?.id || null,
          } as any)
          .select()
          .single();
        if (data) {
          convId = data.id;
          setConversationId(data.id);
        }
      }

      // Save user message
      if (convId) {
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          role: "user",
          content,
        });
      }

      // Create assistant placeholder
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          isStreaming: true,
          isThinking: false,
          thinkingContent: "",
          activeTools: [],
        },
      ]);

      const historyMessages = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyMessages.push({ role: "user", content });

      try {
        const thinkingStart = Date.now();
        const controller = new AbortController();
        abortRef.current = controller;
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-completion`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: historyMessages,
              model: selectedModel,
              project_id: projectScope?.id || null,
              conversation_id: convId,
              memo_id: memoContext?.memoId || null,
              odd_project_id: oddContext?.projectId || null,
            }),
            signal: controller.signal,
          }
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${resp.status}`);
        }

        const reader = resp.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n\n")) !== -1) {
            const chunk = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 2);

            const lines = chunk.split("\n");
            let eventType = "";
            let eventData = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) eventType = line.slice(7);
              if (line.startsWith("data: ")) eventData = line.slice(6);
            }

            if (!eventType || !eventData) continue;

            try {
              const data = JSON.parse(eventData);

              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  const updated = { ...m };

                  switch (eventType) {
                    case "thinking_start":
                      updated.isThinking = true;
                      break;
                    case "thinking_delta":
                      updated.thinkingContent = (updated.thinkingContent || "") + data.text;
                      break;
                    case "content_delta":
                      if (updated.isThinking) {
                        updated.isThinking = false;
                        updated.thinkingDuration = Math.round((Date.now() - thinkingStart) / 1000);
                      }
                      updated.content = (updated.content || "") + data.text;
                      break;
                    case "tool_start":
                      updated.activeTools = [
                        ...(updated.activeTools || []),
                        { name: data.name, id: data.id, status: "executing" },
                      ];
                      break;
                    case "tool_executing":
                      // Already shown from tool_start
                      break;
                    case "tool_complete":
                      updated.activeTools = (updated.activeTools || []).map((t) =>
                        t.id === data.id ? { ...t, status: "complete", resultSummary: data.resultSummary } : t
                      );
                      break;
                    case "message_complete":
                      updated.isStreaming = false;
                      break;
                    case "error":
                      updated.isStreaming = false;
                      updated.content = `Error: ${data.message}`;
                      break;
                  }
                  return updated;
                })
              );
            } catch {}
          }
        }
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isStreaming: false, content: `Error: ${e instanceof Error ? e.message : "Failed to connect"}` }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationId, messages, selectedModel, projectScope, memoContext, oddContext]
  );

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        chatWidth,
        setChatWidth,
        chatExpanded,
        messages,
        isLoading,
        conversationId,
        projectScope,
        setProjectScope,
        memoContext,
        setMemoContext,
        oddContext,
        setOddContext,
        selectedModel,
        setSelectedModel,
        sendMessage,
        startNewConversation,
        loadConversation,
        conversations,
        loadConversations,
        deleteConversation,
        stopGeneration,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
```

### 10.2 `src/components/chat/ChatSidebar.tsx`

```tsx
import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, SquarePen, Menu, ChevronDown, Check, Paperclip, ArrowUp, Square } from "lucide-react";
import { useChatContext, type ChatMessage } from "@/contexts/ChatContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatHistory } from "./ChatHistory";
import { ChatEmptyState } from "./ChatEmptyState";
import { DotPattern } from "@/components/magicui/DotPattern";
import { cn } from "@/lib/utils";
import irisHelmet from "@/assets/iris-avatar-helmet.png";

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
    isOpen, setIsOpen, messages, isLoading, sendMessage,
    startNewConversation, selectedModel, setSelectedModel, stopGeneration,
    projectScope, setProjectScope, loadConversations, setChatWidth
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

  const lastAssistantMsg = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant" && m.content && !m.isStreaming),
    [messages]
  );
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(lastAssistantMsg, !!projectScope),
    [lastAssistantMsg, projectScope]
  );

  if (!isOpen) return null;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth =
      (document.querySelector("[data-chat-drawer]") as HTMLElement)?.offsetWidth ?? 420;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const next = Math.min(
        Math.max(360, startWidth + delta),
        Math.round(window.innerWidth * 0.5)
      );
      setChatWidth(next);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div data-chat-drawer className="relative flex flex-col h-full w-full bg-card border-l border-border">
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        className="group absolute left-0 top-0 bottom-0 z-50 w-1.5 -translate-x-1/2 cursor-col-resize"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-1 rounded-full bg-border group-hover:bg-foreground/40 transition-colors" />
      </div>
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
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Close">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {projectScope &&
        <div className="flex items-center gap-2 px-4 pb-2.5">
            <span className="text-[10px] text-muted-foreground font-medium">Context</span>
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
                onClick={isLoading ? stopGeneration : handleSend}
                disabled={!isLoading && !input.trim()}
                title={isLoading ? "Stop generating" : "Send"}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                  isLoading
                    ? "bg-foreground text-background"
                    : input.trim()
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
```

### 10.3 `src/components/chat/ChatMessageBubble.tsx`

```tsx
import { NvestivPulse } from "@/components/ui/NvestivPulse";
import { useState } from "react";
import { ChevronRight, Check, Loader2, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

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
          <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-h1:mt-3 prose-h1:mb-1.5 prose-h2:mt-3 prose-h2:mb-1.5 prose-h3:mt-2.5 prose-h3:mb-1 prose-p:text-[13px] prose-p:leading-snug prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:text-[13px] prose-li:my-0.5 prose-li:leading-snug prose-hr:my-3 prose-blockquote:my-2 prose-code:text-[12px] prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:my-2 prose-table:text-[12px] prose-table:my-2 prose-th:text-[10px] prose-th:uppercase prose-th:tracking-wider prose-th:text-muted-foreground prose-th:font-semibold prose-th:border-b prose-th:border-border prose-td:border-b prose-td:border-border prose-strong:text-foreground prose-a:text-foreground prose-a:underline prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
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
```

### 10.4 `src/components/chat/ChatHistory.tsx`

```tsx
import { ArrowLeft, Trash2 } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

function groupByTime(items: { created_at: string }[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, typeof items> = { Today: [], Yesterday: [], "Previous 7 Days": [], Older: [] };
  items.forEach((item) => {
    const d = new Date(item.created_at);
    if (d >= today) groups["Today"].push(item);
    else if (d >= yesterday) groups["Yesterday"].push(item);
    else if (d >= week) groups["Previous 7 Days"].push(item);
    else groups["Older"].push(item);
  });
  return groups;
}

export function ChatHistory({ onBack }: { onBack: () => void }) {
  const { conversations, loadConversation, deleteConversation } = useChatContext();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groups = groupByTime(conversations);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1 rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">Chat History</span>
      </div>

      {conversations.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">No conversations yet</div>
      ) : (
        <div className="py-2">
          {Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground">{label}</p>
                {items.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => { loadConversation(conv.id); onBack(); }}
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}</p>
                    </div>
                    {hoveredId === conv.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
```

### 10.5 `src/components/chat/ChatEmptyState.tsx`

```tsx
import irisHero from "@/assets/iris-hero.png";

const GLOBAL_PROMPTS = [
  "What deals should I focus on?",
  "What deals should I avoid?",
  "Create an IC memo for a deal",
  "Summarize unresolved red flags",
];

const SCOPED_PROMPTS = [
  "Summarize the key risks for this fund",
  "Draft an IC memo for this deal",
  "What are the unresolved red flags?",
  "Break down the fee structure",
];

export function ChatEmptyState({
  onPrompt,
  isScoped,
}: {
  onPrompt: (prompt: string) => void;
  isScoped: boolean;
}) {
  const prompts = isScoped ? SCOPED_PROMPTS : GLOBAL_PROMPTS;

  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <img
        src={irisHero}
        alt="Iris"
        className="h-16 w-16 rounded-2xl object-cover mb-4 shadow-md"
      />
      <h3 className="text-sm font-semibold text-foreground mb-1">How can I help with your diligence?</h3>
      <p className="text-xs text-muted-foreground mb-6">Ask me anything about your deals</p>
      <div className="grid grid-cols-2 gap-2 max-w-xs">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => onPrompt(p)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-[11px] text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors leading-snug"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 11. Change Log Policy

Every change that touches any file in §4 **must** update this spec in the
same commit. The spec is authoritative: if the spec and the code drift,
the spec wins and the code must be brought back into compliance.
