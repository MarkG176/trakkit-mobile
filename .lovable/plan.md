## Goal

Rewrite RLS across `public` tables so every legitimate function in the app has full visibility to the rows it needs, while keeping tenant isolation. Nothing gets dropped wholesale — policies are replaced with a consistent, workspace-scoped model.

## Problems in the current RLS (observed from `pg_policies`)

1. **Inconsistent workspace scoping.** `get_user_workspace_id()` returns a single workspace, but users can belong to multiple workspaces (see `user_workspaces`). Any row in a non-"current" workspace is invisible even when the user legitimately belongs to it. This is the biggest source of "empty list" bugs.
2. **Supervisor checks split two ways.** Some policies use `is_supervisor()`, others inline `EXISTS (SELECT 1 FROM user_roles WHERE role='supervisor')`. The inline form ignores the `admin → supervisor` mapping the app uses in `RoleBasedRoute.tsx`, so admins are blocked from supervisor-only reads.
3. **Agent-only tables miss supervisor read paths.** E.g. `agent_device_status`, `agent_availability`, `agent_status_log` allow agent self-writes but restrict supervisor reads to a single "current" workspace — supervisor rollups over multi-workspace teams silently drop rows.
4. **Edge-function / trigger writes surface as user rows.** Rows inserted by `service_role` (edge functions, triggers) sometimes carry no `agent_id` or a system UUID, so agent SELECT policies filter them out even for the owning user.
5. **No unified role helper.** `has_role`, `is_supervisor`, and inline `user_roles` lookups drift over time.

## Design

Introduce a small, consistent policy layer that every table uses. No table loses RLS; each gets a cleaner, more permissive-where-appropriate ruleset.

### Helper functions (SECURITY DEFINER, `search_path=public`)

- `public.is_workspace_member(_ws uuid)` → true if `auth.uid()` has any row in `user_workspaces` for `_ws` (any status the app treats as active).
- `public.is_workspace_supervisor(_ws uuid)` → true if the user is a workspace member **and** has role `supervisor` or `admin` in `user_roles` (mirrors `RoleBasedRoute`'s admin→supervisor mapping).
- Keep existing `has_role`, `is_supervisor`, `get_user_workspace_id` for backward compatibility, but stop using them in new policies.

These replace scattered `EXISTS` subqueries and eliminate recursion risk (they read `user_workspaces` / `user_roles`, never the target table).

### Standard policy set per table type

**A. Workspace-scoped, agent-owned** (e.g. `agent_status_log`, `agent_work_segments`, `agent_actions`, `agent_availability`, `agent_device_status`, `agent_tasks`, `sales`, `sale_items`, `interactions`, `store_visits`, `stock_reports`, `daily_sales_tracking`, `daily_stock_reports`, `store_price_reports`, `product_returns`, `notes`, `giveaways`, `survey_responses`, `checkout_requests`, `login_events`, `agent_kpi_results`, `agent_ranks`, `agent_report_summary`, `inventory_transactions`, `stock_movements`, `customer_purchases`, `route_assignments`, `agent_tasks`, `tasks`, `support_tickets`, `supervisor_messages`, `workspace_messages`):

- `SELECT`: `is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR is_workspace_supervisor(workspace_id))`
- `INSERT`: `is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR is_workspace_supervisor(workspace_id))`
- `UPDATE`: same as INSERT for USING and WITH CHECK.
- `DELETE`: `is_workspace_supervisor(workspace_id)` (or owner where the app requires it — kept per table).
- `service_role`: no restriction (bypasses RLS by design).

**B. Workspace-scoped, shared reference data** (e.g. `stores`, `products`, `product_variants`, `customers`, `routes`, `areas`, `buildings`, `apartments`, `location_area_mappings`, `teams`, `team_members`, `kpis`, `stock_report_templates`, `survey_templates`, `survey_questions`, `projects`, `project_plans`, `project_inventory`, `project_assignments`, `project_report_cache`, `analytics_metrics`, `payroll_periods`, `inventory_sessions`, `survey_insight_cache`, `agent_availability`, `reports`):

- `SELECT`: `is_workspace_member(workspace_id)` — every member of the workspace can read shared data.
- `INSERT/UPDATE/DELETE`: `is_workspace_supervisor(workspace_id)` (or `is_workspace_member` where agents need to create, e.g. `stores` via auto-targeting flow, `customers` from sales — kept per table).

**C. User-owned, workspace-linked** (`user_workspaces`, `workspace_invitations`, `device_push_tokens`, `user_app_user_connections`):

- `SELECT`: `user_id = auth.uid() OR is_workspace_supervisor(workspace_id)`.
- Writes: owner-only, except supervisor for `workspace_invitations` and `user_workspaces` role changes.

**D. Public / lookup** (`demo_requests`, `security_audit_log`, `activity_logs`): keep current model (insert-only for anon on `demo_requests`; supervisor-read on audit logs).

**E. Tables currently RLS-off** (`agent_task_inventory`, `client_sync_operations`, `day_plans`, `google_invite_forms`, `google_oauth_tokens`, `google_sheet_links`): enable RLS and apply the appropriate template above. `google_oauth_tokens` gets strict owner-only.

### GRANTs

Re-assert on every `public` table so PostgREST can reach them:
- `GRANT SELECT, INSERT, UPDATE, DELETE ON <t> TO authenticated`
- `GRANT ALL ON <t> TO service_role`
- `GRANT SELECT ON <t> TO anon` only for the small set of pre-login-readable tables (`demo_requests` insert path stays as-is; no anon SELECT elsewhere).

## Migration strategy

Single migration, dynamic loops so nothing is missed:

1. `CREATE OR REPLACE` the two new helpers.
2. For each table in each category, `DROP POLICY IF EXISTS` on every existing policy, then `CREATE POLICY` using the template for that table's category.
3. `ENABLE ROW LEVEL SECURITY` on the five currently-off tables and apply the appropriate template.
4. Re-run the standard GRANT block per table.

The migration is idempotent: re-running produces the same end state.

## Verification

- Re-run the `pg_policies` catalog query — every `public` table has the expected policy count (SELECT/INSERT/UPDATE/DELETE explicit, no wildcard `ALL` policies).
- Run `supabase--linter` and confirm no "RLS disabled" or "policy references target table" findings.
- Spot-check as a supervisor and as an agent using `supabase--read_query` with `set_config('request.jwt.claim.sub', ...)`:
  - Supervisor sees all workspace rows in `agent_status_log`, `sales`, `stock_reports` across every workspace they belong to.
  - Agent sees only their own rows in the same tables, still across every workspace they belong to (fixes the multi-workspace gap).
- Confirm build passes; no client code changes required — the app already filters by `workspace_id` explicitly, and the new policies simply stop over-filtering behind its back.

## Non-goals

- No change to `auth.*`, `storage.*`, `realtime.*`, `vault.*`, `supabase_functions.*`.
- No change to app code in this pass.
- No change to `service_role` behavior (still bypasses RLS).
