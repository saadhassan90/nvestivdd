# Memory: index.md
Updated: just now

# Project Memory

## Core
Monochrome cool-gray palette (HSL hue 220) for all visual styling.
Supabase with RLS enabled on all tables using standard `user_id` pattern.
Event-driven UI updates via Supabase Realtime baton pass (no polling).
Tiered AI models: Claude Opus 4.6, Sonnet 4.5, gpt-4o-mini, text-embedding-3-small.

## Memories
- [Deal Submission](mem://features/deal-submission-requirements) — Submission requirements, auto-extraction, and checklist details
- [Mobile Patterns](mem://ux/mobile-patterns) — Responsive behaviors for dashboard, sidebars, and analytics
- [Document Organization](mem://features/document-organization) — Research Sources list formatting and Data Room diligence tiers
- [Data Schema](mem://architecture/data-schema) — Hybrid relational (18+ tables) and markdown approach
- [Markdown Rendering](mem://tech/markdown-rendering) — Tailwind typography and remark-gfm configuration for dense reports
- [Layout Structure](mem://ux/layout-structure) — Desktop side-by-side containers and drawer behaviors
- [Analysis Status UI](mem://features/analysis-status) — Real-time 13-node progress bar, timer, and update banners
- [Navigation Breadcrumbs](mem://ux/navigation-breadcrumbs) — Breadcrumb pathing rules and exclusions
- [Sidebar Layout](mem://ux/sidebar-layout) — Project detail sidebar stacking and score metrics positioning
- [L1 Report Structure](mem://features/l1-report-structure) — 13-section markdown template, keyword extraction, and tab mapping
- [Ask Iris AI Chat](mem://features/ai-chat-iris) — Parallel retrieval, institutional tone, UI formatting
- [Dashboard Management](mem://features/dashboard-management) — High-density deal rows, interactive sorting, and status handling
- [Knowledge Graph RAG](mem://tech/knowledge-graph-rag) — 3-level hierarchy (Fund, Domain, Entity) with pgvector HNSW
- [Realtime Updates](mem://architecture/realtime-updates) — Event-driven UI pushes via Supabase Realtime
- [Webhook System](mem://architecture/webhook-analysis-system) — Outbound dispatch and asynchronous receive pipeline
- [Analysis Caching](mem://tech/analysis-caching) — Phase-level persistence for task resumption
- [Task Trigger Logic](mem://architecture/task-trigger-logic) — Database trigger queues, cron safety nets, and retry limits
- [AI Model Selection](mem://tech/ai-model-selection) — Tiered model selection for research, assembly, extraction
- [IC Memo Workspace](mem://features/ic-memo-workspace) — L3 page with BlockNote canvas + embedded Iris chat, top-bar stage dropdown
