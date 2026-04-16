

## PRD Analysis — Nvestiv L1 Due Diligence Platform

### What the PRD Describes

Nvestiv is an automated due diligence platform for institutional investors. GPs submit pitch decks, an AI agent analyzes them, and the platform delivers a scored L1 Preliminary Report to help LPs make meet/no-meet decisions. The PRD covers:

1. **Fund Dashboard** (`/funds`) — sortable table of submissions with score, GP, strategy, status, verdict columns; 4 summary metric cards
2. **New Submission Page** (`/funds/new`) — centered upload flow with drag-and-drop, "Start AI analysis" button
3. **Fund Detail** (`/funds/:id`) — three-panel layout: left sidebar (section nav with scores), middle (report body), right (comments/notes panel)
4. **Shared Report** (`/share/:token`) — public read-only view without auth
5. **Scoring System** — 5 dimensions (max 25/25/20/20/10 = 100), verdict thresholds (Meet ≥65, Conditional 50-64, No Meet <50), hard floor gates
6. **Citation System** — inline GP-sourced (blue), verified (green), flagged (amber) tags with tooltip cards
7. **Comment/Annotation System** — right panel with human + AI comments, section-anchored, threaded replies
8. **Processing States** — Preparing → Researching → Finalizing, real-time analysis log streaming
9. **Report Sharing** — private link generation with optional expiry
10. **PDF Export** — paginated report export
11. **Access Control** — account-based with Admin/Analyst roles
12. **Responsive Behavior** — desktop (3-panel), tablet (icon rail + sheet), mobile (single panel)

### What's Already Built

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard with deal table | Done | Has filters, pagination, analytics cards |
| New deal modal | Done | Modal-based (not separate page per PRD) |
| Fund detail — sidebar + report body | Done | Two-panel (missing right comments panel) |
| Overview tab | Done | Score, strengths/risks, module breakdown |
| Team, Performance, Strategy, Flags tabs | Done | With markdown report rendering |
| Interrogatory tab | Done | Question list view |
| Data Room + Research Sources tabs | Done | File management + source list |
| Processing state | Done | Real-time log streaming |
| Webhook dispatch/receive pipeline | Done | External agent integration working |
| Chat sidebar (AI assistant) | Done | Not in PRD — custom addition |

### Key Gaps Between PRD and Current Build

**Major gaps:**
1. **Right comments panel** — PRD specifies a persistent 220px right panel for team comments and AI notes. Currently missing entirely.
2. **Citation system** — No inline citation tags (blue/green/amber) or tooltip cards in report sections
3. **Three-panel layout** — Currently two-panel (sidebar + body). PRD requires sidebar + body + comments
4. **Shared report view** (`/share/:token`) — Not implemented
5. **PDF export** — Not implemented
6. **New submission as standalone page** — Currently a modal, PRD wants `/funds/new`
7. **Access control / auth** — No authentication, roles, or account model
8. **Verdict display logic** — PRD has specific verdict thresholds and hard floor override logic

**Medium gaps:**
9. **Sidebar section scores** — PRD wants score badges next to each section nav item
10. **Dashboard columns** — PRD wants GP name, Strategy pill, Verdict badge columns
11. **Analysis log as section** — PRD wants it as a sidebar nav item, not just a processing view
12. **Fund table auto-sort by score** — PRD wants score-descending default sort
13. **Status states** — PRD defines Preparing/Researching/Scoring/Complete/Failed with specific styling

**Minor gaps:**
14. **Responsive three-panel behavior** — icon rail on tablet, single panel on mobile
15. **Score dimension mapping** — PRD uses specific dimension names and max points (25/25/20/20/10)
16. **Source appendix** — PRD wants APA 7th edition formatting with expandable detail

### Recommendation

The current build has a solid foundation covering the dashboard, report rendering, and webhook pipeline. The largest architectural changes needed are the three-panel layout with comments, the citation system, authentication, and sharing. These should be tackled in priority order based on your roadmap.

Want me to start implementing any of these gaps? I'd suggest prioritizing in this order:
1. Authentication (required for comments, sharing, access control)
2. Three-panel layout with comments panel
3. Citation system
4. Shared report view
5. PDF export

