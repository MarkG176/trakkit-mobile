

## Plan: Add Database-Level Auto-Logging Triggers

### Problem
Currently, `activity_logs` is only populated by explicit client-side `logActivity()` calls. Any action not instrumented in code is silently missed. Database triggers will guarantee every insert on key tables is logged automatically, regardless of whether the client code remembers to call the logger.

### Approach
Create a single reusable Postgres trigger function (`log_table_activity`) and attach it as an `AFTER INSERT` trigger on all key operational tables. Each trigger will insert a row into `activity_logs` with the relevant user, category, action, and details extracted from the new row.

### Tables to instrument (9 triggers)

| Table | Category | Action logged |
|---|---|---|
| `agent_status_log` | attendance | `status_changed` (check-in/out/lunch) |
| `interactions` | sales/giveaway/survey | `interaction_created` with type |
| `inventory_transactions` | inventory | `inventory_transaction` with type |
| `agent_actions` | system | `agent_action` with action_type |
| `stock_reports` | stock_report | `stock_report_submitted` |
| `survey_responses` | survey | `survey_response_submitted` |
| `daily_sales_tracking` | sales | `daily_sale_tracked` |
| `product_returns` | inventory | `product_return_requested` |
| `support_tickets` | system | `support_ticket_created` |

### Technical details

**One migration** containing:

1. A generic `log_table_activity()` trigger function that:
   - Accepts parameters: `category`, `action`, and which columns to extract for details
   - Inserts into `activity_logs` using `NEW.agent_id` (or `NEW.user_id`) as `user_id`
   - Wraps in exception handler so logging never blocks the original insert

2. Nine `AFTER INSERT` triggers, one per table, each calling the function with table-specific parameters.

**What this means**: Every time a row is inserted into any of these tables -- whether from the app, Supabase dashboard, or an edge function -- it will automatically appear in `activity_logs`. No client-side code changes needed.

### No client-side changes required
The existing `logActivity()` calls remain as-is for client-specific context (user_agent, error details). The triggers provide a safety net that catches everything at the database level.

