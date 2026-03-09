

# Updated Plan: Disable RLS for Community Portal

## Change from Original Plan

The user wants this to be an open community portal — anyone with the link can access and submit deals. This means:

- **Skip RLS entirely** on all tables (profiles, projects, documents, task_queue, report_sections, red_flags, interrogatory_items, data_room_items)
- **No authentication** — remove login/signup pages and auth guards
- All data is publicly readable and writable
- No `user_id` filtering on queries
- The `profiles` table and `user_id` FK columns can either be removed or kept nullable for optional future use

## Impact on Architecture

1. **Remove auth pages** (`/login`, `/signup`) — app loads directly to `/dashboard`
2. **Remove protected route wrappers** — no auth checks
3. **Supabase tables created without RLS** — or RLS enabled but with permissive policies allowing all operations
4. **No user avatar or profile** in header — replace with generic icon or remove
5. **projects.user_id** becomes nullable/optional since there's no authenticated user
6. **Simplifies the entire flow** — no auth state management, no session handling

## Technical Note

Supabase requires RLS to be explicitly disabled or permissive policies added. We'll either:
- Not enable RLS at all (simplest), or
- Enable RLS with a blanket `USING (true)` policy if Supabase enforces it

Everything else from the original plan (Magic UI, schema, seed data, all pages/tabs) remains unchanged — just without auth gating.

