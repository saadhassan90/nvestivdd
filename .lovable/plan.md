
# GP Manager Journey — Phased Build Plan

Building the full Manager Platform PRD on top of the existing LP app. One codebase, role-gated. The mode dropdown (LP-ADIA / LP-General / GP) is the role switch.

## Foundation rules (apply to every stage)

- **Same app, role-gated.** No fork. `UiVariantContext.variant === "gp"` drives which routes render, which sidebar is shown, and where the user lands.
- **Chat-as-spine, globally.** Rebuild the layout so Iris docks as a persistent left panel that *reflows* (not overlays) the body. `/chat` is the full-page expanded view of the same conversation. Toggling never resets state. Applied to both LP and GP modes.
- **GP is passive toward LPs.** No outbound DM/email surfaces. Iris is the only thing that touches an LP.
- **Privacy wall is real in the UI.** Feedback tab is empty until first L2 LP; L1 data never surfaces to GP screens.
- **All mock data.** No new tables or edge functions in Phase 1–3. Seed JSON in `src/mocks/gp/`. Real backend work is a later phase.
- **Design system.** Reuse the existing monochrome cool-gray palette + shadcn primitives. No new fonts, no PRD teal/amber/leak colors literally — map to existing semantic tokens (score-strong, gate, destructive, accent).

## Stage 1 — Mode switch + GP shell (smallest shippable)

Goal: flipping the dropdown to GP replaces the entire chrome and lands on `/chat`.

- New `RoleGate` wrapper in `App.tsx`: when `variant === "gp"`, render GP routes; otherwise current LP routes.
- New GP routes (all rendered, mostly placeholders):
  - `/chat` (home), `/raises`, `/raises/:fundId` and 7 sub-tabs, `/pipeline`, `/contacts`, `/settings`
- New `GpSidebar` (shadcn `Sidebar`, `collapsible="icon"`) — Chat · Raises · Pipeline · Contacts · Settings. Active-route highlighting via `NavLink`.
- Switch behavior: changing variant to `gp` calls `navigate("/chat")` and replaces sidebar; switching back to LP returns to `/dashboard`.
- LP routes hidden while in GP mode (and vice versa) — guarded redirects so deep-links resolve correctly.

## Stage 2 — Chat-as-spine layout (global rebuild)

Goal: Iris is a persistent left panel in both modes; `/chat` is the full-page view of the same conversation.

- Replace `AppLayout`'s right-side drawer behavior with a left-docked, reflow layout shell.
- New `WorkspaceShell` component: `[ChatPanel (toggle, resizable)] [BodyView]`. Opening shrinks body; closing expands. No z-index overlay.
- `/chat` route renders the same `ChatProvider` conversation expanded full-width with an empty body slot.
- Keep current `ChatContext`, `ChatSidebar`, `ChatMessageBubble`, and tool registration intact — only the host layout changes.
- Toggle persisted to `localStorage` per role.

## Stage 3 — Raises workspace (the heart of the product)

Goal: a populated Raise context page with all 7 tabs working off mock data.

- `/raises` list: cards per raise with completion % bar, status pill, live signal counts. Seeded with 3 mock raises.
- `/raises/:fundId` layout: tab strip + outlet. Default tab Overview.
- Tabs (built in order, each shippable):
  1. **Overview** — completion bar (4 components: Dataroom / IRIS Report / DDQ / Interview), key metrics, raise status.
  2. **Dataroom** — upload/list/version UI (file rows; upload is mock).
  3. **DDQ** — living Q&A list with provenance chips (ILPA / IRIS-generated / LP-direct), answered/unanswered/IRIS-suggested filters.
  4. **IRIS Interview** — reuses existing chat surface, prompted with gap-fill questions.
  5. **Report Card** — section-addressable analytical read, versioned, "compute once / re-synthesize" structure (reuses existing markdown/section primitives).
  6. **Feedback** — L2+ gated; empty state by default; aggregate-default with per-LP drill (mock once an L2 LP exists in the seed).
  7. **Pipeline (this raise)** — L2+ LP list, consent state column.

## Stage 4 — Cross-raise surfaces + Contacts + Settings

- `/pipeline` — aggregate L2+ LPs across all raises; status, consent, last activity. Filter by raise.
- `/contacts` — GP-side CRM: LPs and placement agents. Reuses table primitives.
- `/settings` — Connectors / Agents / Team. Billing parked.

## Stage 5 — Claim / onboarding (later)

- `/claim/:fundId` pre-auth page seeded from Form D mock; "Create Raise" CTA → onboarding wizard (Pre-Data Room vs Full Data Room split).
- Out of scope for Stage 1; spec captured for later.

## Stage 6 — Backend (later)

- Tables: `funds`, `raises`, `evaluations` (with `level` L1/L2), `ddq_items`, `report_sections`, `engagement_events`, `iris_questions`, `consents`.
- Edge functions: section-job runner, synthesis pass, change-triggered incremental refresh.
- Privacy-wall enforcement at the query layer (RLS-equivalent filtering by `evaluation.level`).
- Not started until UI is validated.

## Out of scope (matches PRD)

- GP→LP messaging of any kind.
- Pre-L2 attribution.
- Cross-raise market intelligence.
- Billing / Manager Services subscription.

## Technical notes

- File additions concentrate in `src/pages/gp/`, `src/components/gp/`, `src/mocks/gp/`.
- Routing: extend `App.tsx` with a `<Routes>` branch keyed off variant. No new router library.
- Layout rebuild touches `AppLayout.tsx` and `ChatSidebar.tsx` host positioning only — message rendering untouched.
- Mock data shapes mirror PRD §4 entities so the later backend swap is a wire-up, not a rewrite.
- Reuse: existing `ChatProvider`, `BlockNote` canvas + chart tools, `MarkdownContent`, `CitationChip`, shadcn primitives.

## Suggested shipping order

1. Stage 1 (shell + mode switch) — small, validates the swap.
2. Stage 2 (chat spine) — biggest layout change; do it before more pages depend on it.
3. Stage 3 tabs in PRD order — each tab is its own ship.
4. Stage 4 cross-raise surfaces.
5. Stages 5–6 once the UI is locked.

Tell me to start Stage 1 and I'll build it.
