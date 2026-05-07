
## Goal
Add Postgres B-tree indexes to columns that are frequently used in WHERE, JOIN, ORDER BY, and equality filters across the app — primarily `user_id`/`agent_id`, `workspace_id`, `project_id`, `store_id`, `team_id`, foreign keys, status fields, and timestamp columns used for sorting (`created_at`, `timestamp`, `recorded_at`, `reported_at`, `work_date`).

## Approach
One migration file with `CREATE INDEX IF NOT EXISTS` statements (idempotent, safe to re-run). All indexes are plain B-tree on `public` schema tables only. Skipping `auth`, `storage`, and other reserved schemas. Skipping views (e.g. `agent_tasks_view`). Existing indexes are preserved.

In addition to single-column indexes, we add a small number of high-value composite indexes that match the app's most common access patterns (e.g. `(workspace_id, agent_id, work_date)` for daily reports/sales, `(agent_id, timestamp DESC)` for status logs).

## Indexes to add

Single-column (representative — full list in migration):
- `agent_status_log`: `status`, `store_id`, `created_at`
- `agent_tasks`: `status`, `created_at`, `started_at`, `completed_at`, `assigned_product_variant_id`
- `agent_task_inventory`: `agent_id`, `task_id`, `product_variant_id`, `is_deleted`, `created_at`
- `daily_sales_tracking`: `work_date`, `recorded_at`, `created_at`
- `daily_stock_reports`: `work_date`, `reported_at`, `store_id`, `created_at`
- `interactions`: `interaction_type`, `product_variant_id`, `survey_template_id`, `is_deleted`, `created_at`
- `customer_purchases`: `store_id`, `product_variant_id`, `created_at`
- `giveaways`: `store_id`, `created_at`
- `notes`: foreign keys + `created_at`
- `sale_items`: foreign keys + `created_at`
- `stores`: workspace/project FKs + `is_deleted`
- `teams` / `team_members`: `team_id`, `agent_id`, `is_active`, `created_at`
- `tasks`, `day_plans`, `checkout_requests`, `stock_movements`, `inventory_transactions`, `product_returns`, `support_tickets`, `messages`, `activity_logs`, `agent_battery_status`, `agent_device_status`, `agent_daily_work_summary`, `agent_work_segments`, `agent_ranks`, `agent_kpi_results`, `customers`, `survey_*`, `user_workspaces`, `user_roles`: missing FK / `created_at` / `status` columns

Composite (high-value):
- `agent_status_log (agent_id, timestamp DESC)`
- `agent_status_log (workspace_id, timestamp DESC)`
- `daily_sales_tracking (workspace_id, agent_id, work_date)`
- `daily_stock_reports (workspace_id, agent_id, work_date)`
- `interactions (workspace_id, agent_id, timestamp DESC)`
- `interactions (agent_id, timestamp DESC)`
- `sale_items (workspace_id, created_at DESC)`
- `notes (workspace_id, created_at DESC)`
- `giveaways (workspace_id, recorded_at DESC)`
- `team_members (team_id, agent_id)`
- `user_workspaces (user_id, workspace_id)`

## Notes
- All statements use `CREATE INDEX IF NOT EXISTS` so re-runs are no-ops.
- Skipping `CONCURRENTLY` because Supabase migrations run inside a transaction; tables are small enough that a brief lock is acceptable. If needed later, the indexes can be rebuilt concurrently.
- This is purely additive — no schema or data changes, no risk to existing queries.
- Pre-existing TypeScript build errors in `src/utils/permissionUtils.ts` are unrelated to this change and will be addressed separately.

## Deliverable
A single new migration file under `supabase/migrations/` containing the `CREATE INDEX IF NOT EXISTS` statements.
