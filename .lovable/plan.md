# Fix: Check-in inconsistency + inventory not loading after RLS changes

## Root cause

The new RLS layer keys every policy off `workspace_id` via `is_workspace_member(workspace_id)`. That helper returns **false when `workspace_id` is NULL**. Two things break because of that:

1. **Inventory query returns 0 rows.** `useInventory` inner-joins `agent_task_inventory → agent_tasks → product_variants`. `agent_tasks` now has RLS `is_workspace_member(workspace_id) AND agent_id = auth.uid()`. There are **294 `agent_tasks` rows with NULL `workspace_id`** (legacy inserts from before the column was populated). The inner join filters them out, so the inventory list is empty even when the agent has products assigned. `agent_task_inventory` itself has no `workspace_id` column, so it relies entirely on the parent task's workspace being visible.

2. **Check-in intermittently fails.** `agent_status_log` INSERT policy is `is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR supervisor)`. `useAgentStatus.updateStatus` passes `workspace_id: currentWorkspaceId`, but that value comes from `useWorkspace()` which is populated asynchronously by `workspaceService.initialize` after auth. If the user taps check-in before workspace context resolves (slow network, first load, background tab), `currentWorkspaceId` is `null`, the policy fails, and the insert is rejected. Retrying works because the workspace has resolved by then. There are already **95 `agent_status_log` rows with NULL workspace_id** confirming this has been happening.

Other tables (`product_variants`, `products`) have no NULL workspace_ids, so they are not the cause.

## Fix

Two-part fix — one migration to heal the data, one client change to stop it recurring.

### 1. Database migration

- Backfill `agent_tasks.workspace_id` from the assigning agent's active `user_workspaces` row (fallback: the workspace of any `product_variant` referenced by the task's inventory rows).
- Backfill `agent_status_log.workspace_id` from the agent's active `user_workspaces` row.
- Add `NOT NULL` on `agent_tasks.workspace_id` and `agent_status_log.workspace_id` after backfill so future inserts without a workspace fail loudly instead of silently going invisible.
- Add a trigger on `agent_status_log` that fills `workspace_id` from `get_user_workspace_id()` when the client omits it, as a belt-and-braces guard.

### 2. Client change (`src/hooks/useAgentStatus.tsx`)

Block `updateStatus` when `currentWorkspaceId` is null and surface a clear "Workspace still loading — try again" toast instead of letting the insert hit RLS. This prevents new orphan rows and gives the user a real error message.

## Technical details

- `is_workspace_member(_ws)` explicitly returns false for NULL — that is correct behaviour, not a bug in the helper.
- `agent_task_inventory` has no `workspace_id` and its own policy is `agent_id = auth.uid() OR supervisor`, so once the parent `agent_tasks` rows become visible the inner join in `useInventory` will return the expected rows without policy changes there.
- No change needed to `product_variants` / `products` policies — their rows already have workspace_id set.
- Backfill query outline:
  ```sql
  UPDATE public.agent_tasks t
  SET workspace_id = uw.workspace_id
  FROM public.user_workspaces uw
  WHERE t.workspace_id IS NULL
    AND uw.user_id = t.agent_id
    AND COALESCE(uw.is_active, true) = true;
  ```
  Same shape for `agent_status_log`. Any residual NULL rows (agent no longer in a workspace) get deleted or left NULL and remain invisible — acceptable since they were already unreachable.
