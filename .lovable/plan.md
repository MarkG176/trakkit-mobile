## Goal

Cache each user's active mobile components on `user_workspaces.active_components` so the mobile app can render its navigation and gates immediately after sign-in, without an extra round-trip to `project_components` / `project_plans` on every load.

Source of truth: `project_plans.mobile_components` (jsonb) of the project the user's team is assigned to (`team_members.agent_id` → `teams.project_id` → `project_plans.id`).

## Database changes (single migration)

1. **Add column**
   - `ALTER TABLE public.user_workspaces ADD COLUMN active_components jsonb;`
   - Nullable; `NULL` = "not yet computed, fall back to defaults".

2. **Helper function** `public.compute_user_workspace_active_components(p_user_id uuid, p_workspace_id uuid) RETURNS jsonb`
   - Looks up the user's team in that workspace via `team_members` (active, not deleted), joins `teams` → `project_plans`, returns `project_plans.mobile_components`.
   - Returns `NULL` if no team / no plan / no mobile_components.

3. **Sync triggers** (all `SECURITY DEFINER`, `search_path = public`)
   - `trg_sync_active_components_on_team_member` — AFTER INSERT/UPDATE/DELETE on `team_members`: recompute for the affected agent in that team's workspace.
   - `trg_sync_active_components_on_team` — AFTER UPDATE OF `project_id, workspace_id` on `teams`: recompute for every member of that team.
   - `trg_sync_active_components_on_plan` — AFTER UPDATE OF `mobile_components` on `project_plans`: recompute for every user whose team is on that plan.

4. **Backfill**
   - One-shot `UPDATE public.user_workspaces uw SET active_components = public.compute_user_workspace_active_components(uw.user_id, uw.workspace_id);` at the end of the migration.

No RLS changes — existing `user_workspaces` policies already cover the new column.

## Frontend changes

1. **`src/services/workspaceService.ts`**
   - Add `active_components` to the `UserWorkspace` interface and to the `select(...)` in `loadUserWorkspaces`.
   - Store it on the cached `userWorkspaces[]`.
   - Expose `getCurrentActiveComponents(): ProjectComponentFlags | null` that returns the entry for `currentWorkspaceId`.

2. **`src/hooks/useWorkspace.tsx`**
   - Surface `currentActiveComponents` on the context, derived from the cached `userWorkspaces` entry — zero extra queries after sign-in.

3. **`src/hooks/useProjectComponents.tsx`**
   - New fast path: if `useWorkspace().currentActiveComponents` is present, return it synchronously (`isLoaded = true` on first render).
   - Keep the existing `project_components` fetch as a fallback only when the cached value is missing, so older workspaces keep working until the backfill / trigger fills them in.
   - Continue to merge over `DEFAULT_FLAGS` to tolerate partial jsonb.

4. **Types**
   - `src/integrations/supabase/types.ts` will be regenerated automatically after the migration; do not edit by hand.

## Shape of `active_components`

Stored exactly as `project_plans.mobile_components` (jsonb object of boolean flags, e.g. `{ "enable_record_sale": true, "enable_inventory": false, ... }`). Frontend merges with `DEFAULT_FLAGS` so any missing key is treated as enabled (matching today's behavior).

## Out of scope

- No changes to `project_components` table or supervisor UI that edits it. If you later want `project_components` to also flow into `active_components`, that's a follow-up.
- No RLS / auth changes.
- No new UI surfaces — purely a perf / cold-start improvement.