---
name: Iris Canvas Tools
description: Animated chart fences in BlockNote canvases, plus client-rendered clarification tools (ask_quick_reply, ask_form) in Iris chat
type: feature
---

## Animated chart blocks (BlockNote)
- Custom block `animatedChart` lives in `src/components/memo/blocks/AnimatedChartBlock.tsx`.
- Registered in both `IcMemoCanvas` and `OddSectionEditor` via `BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs, animatedChart } })`.
- Renders Recharts (bar / line / area / pie / donut) inside an entry-animated SVG container. Mono palette by default.
- Stored as a single string prop `json`. Inline hover toolbar exposes a JSON editor.
- Markdown round-trip: `toExternalHTML` emits `<pre><code class="language-chart">{json}</code></pre>` which `blocksToMarkdownLossy` writes as a ```chart fence. On seed, `postProcessChartBlocks` converts any parsed `codeBlock` with language `chart` into an `animatedChart` block.

## Iris writes charts directly
System prompts (memo + ODD) include CHART_FENCE_INSTRUCTIONS: when the user asks for a chart/graph/plot/visualization, Iris embeds a ```chart fence inside its `edit_memo` / `edit_odd_section` call. Never paste chart JSON or instructions into chat — it belongs in the canvas.

## Clarification UI (client-rendered tools)
- `ask_quick_reply({ question, options[] })` → renders chips (`InteractiveQuickReply`).
- `ask_form({ title?, submitLabel?, fields:[{key,label,type,options?,placeholder?,required?}] })` → renders a shadcn form (`InteractiveForm`).
- Both tools are no-ops server-side — they return `{ awaiting_user: true }` immediately so the model stops generating.
- Server emits a new `interactive_request` SSE event carrying the tool input. `ChatContext` stores it on the assistant message as `interactive: { id, kind, input, answered }`.
- `ChatMessageBubble` renders the chips/form inline. On pick/submit, `submitInteractive` marks the message answered and dispatches the answer as the next user message (chips: raw text; form: `key: value` lines).

## Rich chat rendering
`ChatMessageBubble` passes a `components` map to `ReactMarkdown`:
- Tables → shadcn `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableCell`.
- Fenced code → `CodeBlock` (language label + copy button). Fenced ` ```chart ` → inline `AnimatedChartRender`.
- Inline `code` → muted pill.
- Links → new tab.

## Exposed in every mode
Clarification tools are merged with the per-mode edit tools in `chat-completion/index.ts`. Edit modes (memo / ODD) still expose only their single edit tool plus the two clarification tools — keeping tool selection fast.

## Test recipe
1. In `/project/:id/memo`, ask Iris "chart our IRR by year as a bar chart". A bar chart block should appear in the canvas, not in chat.
2. Ask "should I expand the executive summary or rewrite it?". Iris should call `ask_quick_reply` → chips render in chat.
3. Ask "draft the fees section with my preferred terms". Iris should call `ask_form` for the missing inputs.