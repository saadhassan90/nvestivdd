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
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = window.localStorage.getItem("chatIsOpen");
    return raw === null ? true : raw === "true";
  });
  const setIsOpenPersist = useCallback((open: boolean) => {
    setIsOpen(open);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatIsOpen", String(open));
    }
  }, []);
  const [chatWidth, setChatWidthState] = useState<number>(() => {
    if (typeof window === "undefined") return 480;
    const defaultW = Math.round(window.innerWidth * 0.3);
    const maxW = Math.round(window.innerWidth * 0.5);
    const raw = window.localStorage.getItem("chatWidth");
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 360) return Math.min(n, maxW);
    return Math.max(360, defaultW);
  });
  const setChatWidth = useCallback((w: number) => {
    setChatWidthState(w);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chatWidth", String(Math.round(w)));
    }
  }, []);
  // Re-clamp chat width to <= 50vw whenever the viewport resizes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      const maxW = Math.round(window.innerWidth * 0.5);
      const minW = Math.min(360, maxW);
      setChatWidthState((prev) => Math.min(Math.max(prev, minW), maxW));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
        setIsOpen: setIsOpenPersist,
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
