## What "Efferd style" means here

From their free blocks (App Shell 1, Dashboard 1, Hero, etc.), the visual language is:

- **Surface**: Warm off-white background (`#fafafa`-ish), pure white cards, thin 1px hairline borders, almost no shadow.
- **Type**: Heavy geometric display sans for headings (Geist / similar), neutral sans for body. Section labels lowercase muted, not uppercase eyebrows.
- **Sidebar**: Grouped sections with lowercase "Product / Administration" labels in muted gray. Active item = soft gray pill (`bg-muted`), icon + label, no chevrons.
- **Topbar**: Inside the framed shell, breadcrumb on the left, icon-only search/bell/support on the right.
- **KPI row**: Full-bordered rectangle split by vertical dividers, small label top-left, trend chip top-right (mint for positive, soft red for negative), large bold number bottom-left.
- **Tables**: Borderless rows, subtle muted header row, hover background, dot/pill status indicators.
- **Buttons**: Solid near-black primary, ghost secondary, generous horizontal padding, `rounded-md`.
- **Charts**: Monochrome area fills with one accent line, minimal grid.

## Why a phased rollout

The app has 30+ pages (GP shell, raises list + 6 sub-pages × N raises, pipeline Sankey, NDAs, IC memo BlockNote canvas, ODD canvas, LP rail + report L1/L2/L3, chat sidebar, share/NDA modals, etc.). Rebuilding all of them in one turn is impractical and high-risk. The plan ships in 4 phases that each leave the app in a fully working, visually-consistent state.

---

## Phase 1 — Foundation (this turn)

Lay the design tokens + primitive restyle so every existing page picks up the Efferd look automatically.

- `src/index.css` tokens: warm off-white background, pure-white cards, hairline border, mint/soft-red trend tokens, monochrome score scale aligned to grayscale. Keep semantic token names so no component breaks.
- Install Geist via `@fontsource-variable/geist` + `@fontsource-variable/geist-mono`. Wire into `tailwind.config.ts` as the default `font-sans` / `font-mono`. Heading font remains Geist (same family, bolder weight).
- Restyle the shadcn primitives that drive 80% of the UI:
  - `button.tsx` — tighter radius, near-black primary, refined ghost/outline.
  - `card.tsx` — hairline border, no shadow, tighter header padding.
  - `input.tsx` / `select.tsx` / `textarea.tsx` — flatter, hairline border, focus ring uses ring token.
  - `badge.tsx` — add `trend-up`, `trend-down`, `soft` variants that match Efferd chips.
  - `table.tsx` — borderless rows, muted header, hover row.
  - `tabs.tsx` — underline tabs (the Efferd style), not pill tabs.
- Drop a new `EfferdKpiRow` + `EfferdKpiCell` primitive under `src/components/ui/kpi.tsx` that any page can use for the bordered-row KPI pattern.

## Phase 2 — App shell + navigation

- Rebuild `GpShell.tsx` + `GpSidebar.tsx` to the Efferd App Shell 1 pattern: max-width framed container, grouped sidebar with "Product" / "Administration" labels, inline breadcrumb header with right-aligned icon cluster.
- Rebuild `AppLayout.tsx` + `LpRail.tsx` with the same shell so LP and GP share one visual chassis.
- Compact chat history panel restyled to Efferd's list-item pattern (muted label, hover fill, active pill).

## Phase 3 — High-traffic pages

- `RaisesList`, `RaiseOverview` (incl. checklist + fund-specifics card), `Pipeline` (Sankey + table), `RaiseDataroom`, `RaiseDdq`.
- All KPI strips and stat cards swap to `EfferdKpiRow`.
- All tables move to the new restyled `table.tsx` with status dots instead of colored pills.

## Phase 4 — Long-tail pages + report surfaces

- `RaiseReportCard` (L1/L2/L3 side tabs), `RaiseInterview`, `RaiseFeedback`, `RaisePipeline`, `Ndas`, `NdaSignPage`.
- LP-side `L1OnePager` + section cards + `ProjectChrome` topbar.
- IC memo + ODD canvas chrome (the BlockNote content typography stays — it's already tuned).
- Modals: `ShareRaiseModal`, `SendNdaModal`, `NdaPreviewDrawer`, `NewRaiseModal`.

---

## Technical notes

- All restyling stays inside shadcn primitives + `index.css` tokens. No component API breaks — pages keep using `<Button>`, `<Card>`, etc.
- BlockNote-specific CSS (`ic-memo-canvas.css`, `odd-section-editor.css`) is left alone in phases 1-3; only the surrounding chrome changes.
- No Efferd paid blocks are pulled. Patterns are replicated from the free previews using standard shadcn + Tailwind.
- After each phase I'll pause for your review before starting the next — easier to course-correct than to undo a 4-phase mega-diff.

I'll start phase 1 as soon as you approve.