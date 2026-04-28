## Goal

Generate a comprehensive Product Requirements Document (PRD) describing the **Nvestiv Institutional Archive** platform in writing, with detailed sections covering each tab, sub-section, and component.

## Format

Deliver as **two artifact files** in `/mnt/documents/`:
1. `Nvestiv_Platform_PRD.md` — fully formatted markdown source
2. `Nvestiv_Platform_PRD.docx` — Word document version (so the user can edit/share)

## PRD Structure (sections)

1. **Executive Summary** — what the platform does, who it's for (LP allocators / IC analysts), the L1 → L2 → L3 diligence pipeline.
2. **Platform Architecture Overview**
   - React 18 + Vite + Tailwind frontend
   - Lovable Cloud (Supabase) backend: 28 tables, RLS, realtime, pgvector knowledge graph, edge functions
   - AI: Lovable AI Gateway (tiered Gemini / GPT-5 models), Gemini API for chat + memo editing
3. **Top-Level Navigation**
   - Dashboard, Project Detail, IC Memo workspace, Notifications, global Ask Iris drawer
4. **Dashboard Page** (`/dashboard`)
   - Top bar: logo, Command-K search, notifications, Ask Iris pill
   - Analytics cards (totals, processing, flag counts, score distribution)
   - Filter bar (asset class, score tier, recommendation, status, stage, search, sort)
   - Deal table (high-density rows, sortable columns, pagination, flag indicators, recommendation pills, score badges)
   - New Deal modal (file upload submission flow)
   - Empty state, mobile FAB, mobile bottom nav
5. **Project Detail Page** (`/project/:id`) — Stage L1 "Triage"
   - Top bar with stage dropdown (L1 active, L2 locked, L3 IC Memo)
   - Left sidebar: report-level switcher + 10 nav items
   - Right Insights/Iris chat panel
   - Hard-floor banner (global)
   - Per-tab deep-dive sections:
     - **Overview** — Hero verdict snapshot, Abstract, Findings Overview, Fund Snapshot (14-row), Source Materials, Cross-reference
     - **Scorecard** — Composite Score, Hard Floor Gates, 5-Dimension Rubric, Verdict & Recommendation, Meeting Conditions, Score Tier Thresholds
     - **Team** — Sponsor Entities, Person Cards, Service Providers, Network & Affiliations, Team Flags, Team Interrogatory (A-series)
     - **Strategy** — Investment Thesis, Portfolio Construction, Target Company Profile, Term Structure, Economics, Target Returns, Fee Benchmark, Strategy Flags, Strategy Interrogatory (C-series)
     - **Performance** — Headline Metrics, Scale & Count, In-Strategy Breakdown, Multiple Expansion, Securitizations/Placements, Investor Verification, Performance/Scale, Reconciliation Note, Benchmarks, Performance Flags
     - **Risk (Red Flags)** — Severity Summary, Critical/Elevated/Monitor flags, Hard Floor Gate Detail, Discrepancies Found, Regulatory & Litigation, Carry-forward Risk
     - **Interrogatory Matrix** — Question Counts, Filters, Questions Table (editable 0–3 GP score), Scoring Guidance, per-dimension view
     - **Sources** — A–G citation taxonomy, Disambiguation, Confidence Legend, Negative-Results Ledger
     - **Analysis Log** — 13-node real-time progress, timer, banners
     - **Dataroom** — Submission Quality, Critical Missing Documents, Priority Checklist (P1–P4), Completeness Verification, Actions
6. **IC Memo Workspace** (`/project/:id/memo`) — Stage L3
   - Top bar with Stage Dropdown + "Back to Reports"
   - BlockNote editor (Notion-style): h1–h5, body, dividers, tables, code blocks, images, weblinks, file uploads, slash menu, Cmd-Z undo
   - Memo toolbar: fund name, save state, last-saved-at, reset to template
   - Embedded Iris chat (always-on co-author, 420px right column)
   - Persistence: `ic_memos` table (content_json, content_markdown, version)
   - Seed-from-L1 skeleton (12 H2 sections, missing data → `_[NOT YET DRAFTED]_`)
7. **Iris AI Chat (Ask Iris)**
   - Global drawer + embedded memo variant
   - Project-scoped retrieval, conversation history, knowledge-graph + embeddings RAG
   - Tiered model selection
   - Notion-style markdown rendering, institutional tone
8. **Backend / Data Schema** — table inventory grouped by domain (Project core, Scoring, Team, Performance, Strategy, Risk, Documents, Knowledge Graph, Chat, IC Memo, Pipeline, Queue)
9. **AI & Analysis Pipeline**
   - Webhook dispatch + receive
   - Task queue with retry, cron safety net
   - Phase-level caching
   - Knowledge graph build (Fund / Domain / Entity 3-tier with pgvector HNSW)
   - 13-step real-time progress stream via Supabase Realtime
10. **Notifications**
11. **Search (Command-K)**
12. **Mobile / Responsive Behavior**
13. **Security & RLS Posture**
14. **Glossary** — L1/L2/L3, hard floor, severity tiers, citation categories, GP response score, etc.

## Deliverables

Two files in `/mnt/documents/`:
- `Nvestiv_Platform_PRD.md`
- `Nvestiv_Platform_PRD.docx`

Both will be emitted as `<lov-artifact>` tags so the user can preview and download. The DOCX will use the docx-js skill (US Letter, Arial, proper headings/lists/tables) and will be QA'd by converting to images.

No code changes to the application itself.