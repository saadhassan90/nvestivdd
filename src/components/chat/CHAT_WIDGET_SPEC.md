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
__CTX__
```

### 10.2 `src/components/chat/ChatSidebar.tsx`

```tsx
__SIDEBAR__
```

### 10.3 `src/components/chat/ChatMessageBubble.tsx`

```tsx
__BUBBLE__
```

### 10.4 `src/components/chat/ChatHistory.tsx`

```tsx
__HISTORY__
```

### 10.5 `src/components/chat/ChatEmptyState.tsx`

```tsx
__EMPTY__
```

---

## 11. Change Log Policy

Every change that touches any file in §4 **must** update this spec in the
same commit. The spec is authoritative: if the spec and the code drift,
the spec wins and the code must be brought back into compliance.
