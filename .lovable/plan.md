## Goal

Introduce a UI variant switcher on the dashboard top row so the app can host two parallel experiences:

- **Adia** (new default) — a tailored user journey we will build out next.
- **General** — everything that exists today, untouched.

The switcher is the foundation. After it lands, future prompts can scope changes to one variant without bleeding into the other.

## What you'll see

Dashboard top bar, left side, on the same line as the logo and search:

```
[Nvestiv logo]  [Adia ▾]   [Search…]                [Notifications] [Ask Iris]
```

- Dropdown options: **Adia** (default) and **General**.
- Selection persists across reloads (per browser) and is shared across every page.
- No visible change anywhere else yet — both variants render identically today.

## How variants work going forward

- A single `useUiVariant()` hook returns the current variant.
- Variant-specific work is **additive and conditional**: when we build an Adia-only screen or component, we branch on `variant === "adia"`. The General path keeps its current code unchanged.
- Variants share routes and the backend. The journey divergence lives in the UI layer (pages, components, navigation), so nothing in Supabase or the analysis pipeline needs to fork.
- Routes stay shared. If an Adia-specific page is needed, it renders behind the variant check on the same URL, so links don't break when toggling.

## Implementation

1. **`UiVariantContext`** (`src/contexts/UiVariantContext.tsx`)
   - `variant: "adia" | "general"`, `setVariant`, default `"adia"`.
   - Persists to `localStorage` under `nvestiv.ui-variant`; rehydrates on mount.
   - Provider mounted in `src/App.tsx` alongside `ChatProvider`.

2. **`VariantSwitcher`** (`src/components/layout/VariantSwitcher.tsx`)
   - Compact monochrome dropdown built on existing `DropdownMenu` primitives.
   - Shows current variant label with a chevron; menu lists Adia and General with a checkmark on the active option.
   - Sized to sit inline next to the logo on desktop; collapses to icon-only label on small screens to avoid crowding the search input.

3. **Dashboard top bar** (`src/pages/Dashboard.tsx`)
   - Insert `<VariantSwitcher />` between the logo `Link` and `<CommandSearch />`.
   - No other layout changes.

## Out of scope (handled in follow-up prompts)

- No actual divergence between Adia and General is introduced yet.
- No new routes, no schema changes, no backend changes.
- The Adia journey itself will be defined and built in subsequent prompts.

## Files touched

- add `src/contexts/UiVariantContext.tsx`
- add `src/components/layout/VariantSwitcher.tsx`
- edit `src/App.tsx`
- edit `src/pages/Dashboard.tsx`
