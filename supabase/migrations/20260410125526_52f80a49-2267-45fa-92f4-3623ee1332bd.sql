
-- Generic trigger function for auto-logging activity
CREATE OR REPLACE FUNCTION public.log_table_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_category TEXT;
  v_action TEXT;
  v_workspace_id UUID;
  v_details JSONB := '{}'::JSONB;
BEGIN
  -- Extract parameters passed via TG_ARGV
  v_category := TG_ARGV[0];
  v_action := TG_ARGV[1];

  -- Resolve user_id: try agent_id first, then user_id
  IF TG_NARGS > 2 AND TG_ARGV[2] = 'user_id' THEN
    v_user_id := NEW.user_id;
  ELSE
    v_user_id := NEW.agent_id;
  END IF;

  -- Resolve workspace_id if the column exists
  BEGIN
    EXECUTE format('SELECT ($1).%I', 'workspace_id') INTO v_workspace_id USING NEW;
  EXCEPTION WHEN OTHERS THEN
    v_workspace_id := NULL;
  END;

  -- Build details based on the source table
  CASE TG_TABLE_NAME
    WHEN 'agent_status_log' THEN
      v_details := jsonb_build_object('status', NEW.status, 'store_id', NEW.store_id);
    WHEN 'interactions' THEN
      v_details := jsonb_build_object('interaction_type', NEW.interaction_type, 'outcome', NEW.outcome, 'product_variant_id', NEW.product_variant_id);
      -- Override category based on interaction type
      IF NEW.interaction_type = 'giveaway' THEN v_category := 'giveaway';
      ELSIF NEW.interaction_type = 'survey' THEN v_category := 'survey';
      ELSE v_category := 'sales';
      END IF;
    WHEN 'inventory_transactions' THEN
      v_details := jsonb_build_object('type', NEW.type, 'product_id', NEW.product_id, 'qty', NEW.qty);
    WHEN 'agent_actions' THEN
      v_details := jsonb_build_object('action_type', NEW.action_type, 'points_earned', NEW.points_earned);
    WHEN 'daily_stock_reports' THEN
      v_details := jsonb_build_object('report_type', NEW.report_type, 'product_variant_id', NEW.product_variant_id, 'stock_level', NEW.stock_level);
    WHEN 'daily_sales_tracking' THEN
      v_details := jsonb_build_object('product_variant_id', NEW.product_variant_id, 'quantity_sold', NEW.quantity_sold, 'total_value', NEW.total_value);
    WHEN 'product_returns' THEN
      v_details := jsonb_build_object('status', NEW.status, 'return_date', NEW.return_date);
    WHEN 'support_tickets' THEN
      v_details := jsonb_build_object('status', NEW.status);
    ELSE
      v_details := '{}'::JSONB;
  END CASE;

  -- Insert into activity_logs; never fail
  INSERT INTO activity_logs (user_id, action, category, status, details, workspace_id)
  VALUES (v_user_id, v_action, v_category, 'success', v_details, v_workspace_id);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Silently swallow — logging must never block the original operation
  RETURN NEW;
END;
$$;

-- 1. agent_status_log → attendance / status_changed
CREATE TRIGGER trg_log_agent_status
AFTER INSERT ON public.agent_status_log
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('attendance', 'status_changed');

-- 2. interactions → sales (overridden per type) / interaction_created
CREATE TRIGGER trg_log_interaction
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('sales', 'interaction_created');

-- 3. inventory_transactions → inventory / inventory_transaction
CREATE TRIGGER trg_log_inventory_tx
AFTER INSERT ON public.inventory_transactions
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('inventory', 'inventory_transaction');

-- 4. agent_actions → system / agent_action
CREATE TRIGGER trg_log_agent_action
AFTER INSERT ON public.agent_actions
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('system', 'agent_action');

-- 5. daily_stock_reports → stock_report / stock_report_submitted
CREATE TRIGGER trg_log_stock_report
AFTER INSERT ON public.daily_stock_reports
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('stock_report', 'stock_report_submitted');

-- 6. daily_sales_tracking → sales / daily_sale_tracked
CREATE TRIGGER trg_log_daily_sale
AFTER INSERT ON public.daily_sales_tracking
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('sales', 'daily_sale_tracked');

-- 7. product_returns → inventory / product_return_requested
CREATE TRIGGER trg_log_product_return
AFTER INSERT ON public.product_returns
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('inventory', 'product_return_requested');

-- 8. support_tickets → system / support_ticket_created
CREATE TRIGGER trg_log_support_ticket
AFTER INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.log_table_activity('system', 'support_ticket_created');
