## Goal

Upgrade Iris in two ways:
1. **Chat rendering is genuinely rich** — proper shadcn tables, code blocks with syntax highlighting + copy, quick-reply chips, and full shadcn clarification forms (model picks per turn).
2. **Iris directly mutates the canvas** — if you ask for a chart, an animated SVG chart block is inserted into BlockNote. No more "here's the data, you place it."

Scope: both BlockNote canvases (`IcMemoCanvas` for IC Memo, `OddSectionEditor` for ODD).

---

## 1. Custom BlockNote block: `animatedChart`

New file `src/components/memo/blocks/AnimatedChartBlock.tsx` — registered via `createReactBlockSpec` and added to the schema in both `IcMemoCanvas.tsx` and `OddSectionEditor.tsx`.

Props stored in the block:
- `chartType`: `bar | line | area | pie | donut`
- `title`, `subtitle`, `xLabel`, `yLabel` (strings)
- `data`: JSON string — array of `{ label, value }` or `{ label, series: {a:n,b:n} }`
- `palette`: `mono` (default, matches design system) | `signal`

Rendered with **Recharts** (already a common shadcn pairing) inside an `<svg>` shell, plus a 700ms entry animation:
- Bars/areas: animate height/width from 0 using Recharts' built-in `isAnimationActive` + `animationDuration`.
- Lines: `stroke-dasharray` + `stroke-dashoffset` keyframe so the line "draws in".
- Pie/donut: rotational sweep.

The block exposes a small inline toolbar (chart type switcher + edit JSON popover) so the user can tweak after insertion.

Roundtripping markdown: `toExternalHTML`/`parse` serializes the block as a fenced ` ```chart {json...} ``` ` so it survives `blocksToMarkdownLossy` and reseeds correctly on reload. The edge function reads/writes that same fence.

## 2. New canvas-edit tool: `insert_chart`

Add to `chat-completion/index.ts` alongside `edit_memo` / `edit_odd_section`:

```
insert_chart({ section_heading|section_key, position: "after"|"replace_section", chart: {type,title,subtitle,xLabel,yLabel,data,palette} })
```

Server inserts a chart fence into the markdown, saves, realtime push reseeds the editor. System prompt for memo + ODD modes gets:

> If the user asks for a chart, graph, plot, visualization, or "show me X" with numeric data, call `insert_chart` immediately. Never paste raw chart data into chat — always insert the block.

## 3. Chat clarification tools (model picks per turn)

Two new client-rendered tools (no execution server-side — they stream as `tool_use` and the UI renders them as interactive cards in the assistant bubble):

- **`ask_quick_reply`**: `{ question: string, options: string[] }` → renders chips. Click sends the chip text as the next user message.
- **`ask_form`**: `{ title, fields: [{key,label,type:"text"|"select"|"radio"|"number",options?,required?}], submitLabel? }` → renders a shadcn form (`Input` / `Select` / `RadioGroup` / `Label` / `Button`). Submit posts a single user turn with `JSON.stringify(values)` and a human-readable prefix.

Both stream through the existing `activeTools` channel but carry their `input` payload to the bubble so it can render the interactive control. `ChatMessage` gains an optional `interactive?: { kind: "chips"|"form", payload, answered?: boolean }` field that the bubble renders inline (auto-hidden after answer to keep history clean).

System prompt addition (chat mode):

> Before answering ambiguous requests, prefer `ask_quick_reply` for 2–5 discrete choices and `ask_form` for multi-field inputs. Don't ask in prose.

## 4. Richer markdown rendering in the bubble

Replace the current `prose` blob in `ChatMessageBubble.tsx` with structured components passed to `ReactMarkdown`:

- `table`/`thead`/`tbody`/`tr`/`th`/`td` → shadcn `Table` primitives (`@/components/ui/table`) with proper borders, hover, header tint.
- `code` (fenced) → new `CodeBlock` component: language label, copy button, `react-syntax-highlighter` (Prism, `oneDark`/`oneLight` based on theme). Inline `code` stays as a styled `<code>`.
- `pre` is rendered through `CodeBlock`.
- `a` opens in new tab with `rel="noreferrer"`.

Animated SVG charts in chat: if a fenced ```chart block appears in the assistant content (rare — usually we'd use `insert_chart`), render it inline with the same `AnimatedChartBlock` component in read-only mode.

## 5. Memory + small wiring

- New memory file `mem://features/iris-canvas-tools` documenting `insert_chart` + clarification tools + animated chart block contract.
- Update `mem://index.md` to reference it.
- Update `mem://features/ic-memo-workspace` (and add an equivalent line in the ODD workspace memory) noting Iris now inserts chart blocks and renders clarification UIs.

---

## Technical details

**Files created**
- `src/components/memo/blocks/AnimatedChartBlock.tsx` — Recharts + entry animation, used in both canvases.
- `src/components/memo/blocks/chart-block-schema.ts` — `createReactBlockSpec` + markdown serializer.
- `src/components/chat/CodeBlock.tsx` — language label + copy + Prism highlight.
- `src/components/chat/InteractiveQuickReply.tsx` — chip group.
- `src/components/chat/InteractiveForm.tsx` — shadcn form.
- `.lovable/memory/features/iris-canvas-tools.md`.

**Files edited**
- `supabase/functions/chat-completion/index.ts`:
  - register `insert_chart`, `ask_quick_reply`, `ask_form` tools;
  - implement `insert_chart` (fence injector for both memo + ODD sections);
  - `ask_quick_reply`/`ask_form` are no-op server-side: stream the `tool_use` block through to the client (mark them client-rendered, return a stub result so the model can continue);
  - extend system prompts (memo, ODD, chat) with the new directives.
- `src/contexts/ChatContext.tsx`:
  - thread tool input through to the message (extend `activeTools` entry with `input`);
  - add `interactive` resolution on a message; when user clicks a chip / submits form, call `sendMessage` and mark the originating message as `answered`.
- `src/components/chat/ChatMessageBubble.tsx`:
  - use the new `components` map for `ReactMarkdown` (Table, CodeBlock, a);
  - render `InteractiveQuickReply` / `InteractiveForm` when `message.interactive` is set;
  - inline `AnimatedChartBlock` for ```chart fences.
- `src/components/memo/IcMemoCanvas.tsx` and `src/components/odd/OddSectionEditor.tsx`:
  - schema gains `animatedChart` block spec;
  - markdown parsing recognizes ```chart fences and emits the new block.
- `bun add recharts react-syntax-highlighter @types/react-syntax-highlighter` (Recharts may already be present — will check first).

**Behavior contract**
- Anything numeric-comparative the user asks for → chart block inserted into the canvas the chat is scoped to, not pasted in chat.
- Anything ambiguous → chips or form in chat, not a prose question.
- All other answers continue to render as rich markdown (now with real tables + code blocks).

**Not in scope this turn** (call out explicitly): export of chart blocks to PDF/print is best-effort (relies on SVG-in-print); editing chart data via the inline toolbar is JSON-textarea only (no spreadsheet UI).
