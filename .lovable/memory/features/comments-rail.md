---
name: Comments Rail
description: L1 comments rail (CommentsRail), aggregation page, and AI-author distinction backed by `comments` table with realtime
type: feature
---
PRD §5 implementation.

- DB: `public.comments` (project_id, section_id, sub_card_id?, author_type human|ai, author_name, body_md, parent_comment_id?, resolved_at?, report_version, severity?). Realtime enabled.
- UI: `src/components/project/CommentsRail.tsx` replaces `InsightsPanel` on L1 routes; memo route still uses `EmbeddedIrisChat`. Filters: All / Team / AI / Section.
- Aggregation page: `/project/:id/comments` (`src/pages/CommentsPage.tsx`). Filters by section, author, resolved status.
- AI author convention: `author_type='ai'`, displayed as "Nvestiv AI" badge. Synthesis pipeline (Phase 7.4) will write high-severity flags as AI comments.
- Resolve toggle sets/clears `resolved_at`; resolved comments hidden by default on aggregation page, dimmed in rail.
