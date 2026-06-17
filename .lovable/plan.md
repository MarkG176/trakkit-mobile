## Goal

Fix the TypeScript build errors in `src/services/offline/syncHandlers.ts` by creating the Supabase backend objects the offline sync code expects. Once the migration runs, the auto-regenerated `types.ts` will include the new RPCs and table, and the errors disappear without code changes.

## What's missing

The offline sync handlers call 8 RPCs and 1 table that don't exist in the database:

**RPC functions** (each takes `p_client_operation_id uuid`, `p_workspace_id uuid`, `p_payload jsonb` and returns jsonb `{success, error?, ...}`):
1. `sync_record_sale_batch` — insert interactions, inventory_transactions, customer_purchases, agent_actions
2. `sync_record_giveaway` — insert giveaways, inventory_transactions, customers, interactions
3. `sync_daily_stock_reports` — bulk insert into daily_stock_reports
4. `sync_inventory_assign` — bulk insert into agent_task_inventory
5. `sync_create_store` — insert into stores, return `{store_id}`
6. `sync_field_note` — insert into notes
7. `sync_store_price_reports` — bulk insert into store_price_reports
8. `sync_record_survey` — insert interactions + survey_responses + agent_actions

**Table**: `public.client_sync_operations(id uuid PK, workspace_id uuid, agent_id uuid, operation_type text, created_at timestamptz default now())` — used by every RPC to short-circuit duplicate submissions (idempotency on `id`).

## Approach

Each RPC follows the same pattern:

```sql
create or replace function public.sync_<name>(
  p_client_operation_id uuid,
  p_workspace_id uuid,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Idempotency guard
  if exists (select 1 from client_sync_operations where id = p_client_operation_id) then
    return jsonb_build_object('success', true, 'duplicate', true);
  end if;

  -- ... operation-specific inserts mirroring the legacy fallback paths in syncHandlers.ts ...

  insert into client_sync_operations(id, workspace_id, agent_id, operation_type)
  values (p_client_operation_id, p_workspace_id, v_user, '<name>');

  return jsonb_build_object('success', true);
exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;
```

The body of each function is a direct port of the corresponding `*Legacy` function in `src/services/offline/syncHandlers.ts` (lines 116–246 sale, 267–341 giveaway, 362–384 stock, 405–427 inventory, 467–503 store, 533–540 note, 561–579 price, 612–671 survey), so the existing behavior is preserved.

## Steps

1. **Migration** — single migration creating:
   - `public.client_sync_operations` table + GRANTs to `authenticated` and `service_role` (no RLS needed; RLS is disabled per project memory).
   - All 8 `sync_*` RPCs above, granted `EXECUTE` to `authenticated`.

2. **Regenerated types** — Supabase auto-regenerates `src/integrations/supabase/types.ts` after the migration runs, adding the RPCs to the `Functions` union and `client_sync_operations` to the `Tables` union.

3. **Verify** — the build runs automatically; all 16 TS errors in `syncHandlers.ts` should resolve with no code changes (the existing handler code is already shaped to the new API).

## Notes

- No frontend code changes — only DB schema.
- The TS2589 "excessively deep" error on line 477 of syncHandlers.ts is caused by `client_operation_id` not being on any known table; once `client_sync_operations` exists and the legacy `stores` insert is reviewed, that resolves too. If it persists I'll add a narrow `as any` cast on that one line only.
- After the migration I'll come back to your original question about offline upload via waiting/listening.
