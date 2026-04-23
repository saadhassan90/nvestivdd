---
name: IC Memo Workspace
description: L3 IC memo page with BlockNote canvas + always-on embedded Iris chat, stage dropdown in top bar
type: feature
---
**Route**: `/project/:id/memo` → `IcMemoPage`.

**Layout**: 2 columns (no left rail).
- Canvas: BlockNote editor (`@blocknote/mantine`) in centered max-w-[820px] column.
- Right (lg+): 420px embedded Iris chat (`EmbeddedIrisChat`), reuses `ChatProvider`, omits close button.

**Top bar (memo mode)**: `ProjectTopBar` accepts `mode="memo"`. Replaces "Ask Iris" pill with `StageDropdown` (L1 active → `/project/:id?tab=overview`, L2 locked, L3 current) + "Back to Reports" ghost button.

**Persistence**: `ic_memos` table — one row per project_id (unique). Columns: `content_json` (BlockNote doc), `content_markdown` (lossy export + AI context), `version` (int, bumped on each save). Public RLS, realtime enabled. Debounced 1.5s save via `useIcMemo` hook.

**Seed-from-L1 rule**: `buildIcMemoSkeletonMarkdown` produces full skeleton with H1 title + H2 sections (Recommendation, Executive Summary, Fund Overview, Team & Governance, Strategy, Performance & Track Record, Fees & Terms, Risks & Mitigants, Strengths, Diligence Status, Conditions for Advancement, Appendix). Missing data → `_[NOT YET DRAFTED]_`. Skeleton is the seed when no row exists yet, or when user hits Reset.

**Global drawer suppressed**: `AppLayout` hides the global `ChatSidebar` overlay on the memo route (regex `/^\/project\/[^/]+\/memo$/`).

**Chat scope**: `IcMemoPage` calls `setProjectScope({id, name})` on mount.

**Out of scope (not yet built)**: agentic `propose_memo_edit`/`apply_memo_edit` tools in `chat-completion`, PDF export, version history UI, L2 page.
