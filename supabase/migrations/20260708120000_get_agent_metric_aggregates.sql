-- Collapse unbounded client-side sales/giveaway/wholesale aggregations into one
-- SQL round-trip for agent profile stats (P0 perf win from audit plan).
CREATE OR REPLACE FUNCTION public.get_agent_metric_aggregates(
  p_agent_id uuid,
  p_workspace_id uuid,
  p_project_id uuid DEFAULT NULL,
  p_today_start timestamptz DEFAULT NULL,
  p_week_start timestamptz DEFAULT NULL,
  p_today_date date DEFAULT NULL,
  p_week_start_date date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH interaction_sales AS (
    SELECT
      COALESCE(SUM(quantity_sold) FILTER (
        WHERE p_today_start IS NOT NULL
          AND COALESCE(timestamp, created_at) >= p_today_start
      ), 0)::bigint AS today_units,
      COALESCE(SUM(sale_value) FILTER (
        WHERE p_today_start IS NOT NULL
          AND COALESCE(timestamp, created_at) >= p_today_start
      ), 0)::numeric AS today_revenue,
      COALESCE(SUM(quantity_sold) FILTER (
        WHERE p_week_start IS NOT NULL
          AND COALESCE(timestamp, created_at) >= p_week_start
      ), 0)::bigint AS week_units,
      COALESCE(SUM(sale_value) FILTER (
        WHERE p_week_start IS NOT NULL
          AND COALESCE(timestamp, created_at) >= p_week_start
      ), 0)::numeric AS week_revenue,
      COALESCE(SUM(quantity_sold), 0)::bigint AS all_time_units,
      COALESCE(SUM(sale_value), 0)::numeric AS all_time_revenue
    FROM interactions
    WHERE agent_id = p_agent_id
      AND workspace_id = p_workspace_id
      AND interaction_type = 'sale'
      AND NOT COALESCE(is_deleted, false)
  ),
  daily_sales AS (
    SELECT
      COALESCE(SUM(quantity_sold) FILTER (
        WHERE p_today_date IS NOT NULL AND work_date = p_today_date
      ), 0)::bigint AS today_units,
      COALESCE(SUM(total_value) FILTER (
        WHERE p_today_date IS NOT NULL AND work_date = p_today_date
      ), 0)::numeric AS today_revenue,
      COALESCE(SUM(quantity_sold) FILTER (
        WHERE p_week_start_date IS NOT NULL AND work_date >= p_week_start_date
      ), 0)::bigint AS week_units,
      COALESCE(SUM(total_value) FILTER (
        WHERE p_week_start_date IS NOT NULL AND work_date >= p_week_start_date
      ), 0)::numeric AS week_revenue,
      COALESCE(SUM(quantity_sold), 0)::bigint AS all_time_units,
      COALESCE(SUM(total_value), 0)::numeric AS all_time_revenue
    FROM daily_sales_tracking
    WHERE agent_id = p_agent_id
      AND workspace_id = p_workspace_id
      AND (p_project_id IS NULL OR project_id = p_project_id)
  ),
  giveaway_stats AS (
    SELECT
      COUNT(*) FILTER (
        WHERE p_today_start IS NOT NULL AND recorded_at >= p_today_start
      )::bigint AS today_count,
      COALESCE(SUM(total_items) FILTER (
        WHERE p_today_start IS NOT NULL AND recorded_at >= p_today_start
      ), 0)::bigint AS today_items,
      COUNT(*) FILTER (
        WHERE p_week_start IS NOT NULL AND recorded_at >= p_week_start
      )::bigint AS week_count,
      COALESCE(SUM(total_items) FILTER (
        WHERE p_week_start IS NOT NULL AND recorded_at >= p_week_start
      ), 0)::bigint AS week_items,
      COUNT(*)::bigint AS all_time_count,
      COALESCE(SUM(total_items), 0)::bigint AS all_time_items
    FROM giveaways
    WHERE agent_id = p_agent_id
      AND workspace_id = p_workspace_id
      AND NOT COALESCE(is_deleted, false)
      AND (p_project_id IS NULL OR project_id = p_project_id)
  ),
  wholesale_stats AS (
    SELECT
      COALESCE(SUM(quantity) FILTER (
        WHERE p_today_start IS NOT NULL
          AND COALESCE(purchase_date::timestamptz, created_at) >= p_today_start
      ), 0)::bigint AS today_units,
      COALESCE(SUM(total_value) FILTER (
        WHERE p_today_start IS NOT NULL
          AND COALESCE(purchase_date::timestamptz, created_at) >= p_today_start
      ), 0)::numeric AS today_revenue,
      COALESCE(SUM(quantity) FILTER (
        WHERE p_week_start IS NOT NULL
          AND COALESCE(purchase_date::timestamptz, created_at) >= p_week_start
      ), 0)::bigint AS week_units,
      COALESCE(SUM(total_value) FILTER (
        WHERE p_week_start IS NOT NULL
          AND COALESCE(purchase_date::timestamptz, created_at) >= p_week_start
      ), 0)::numeric AS week_revenue,
      COALESCE(SUM(quantity), 0)::bigint AS all_time_units,
      COALESCE(SUM(total_value), 0)::numeric AS all_time_revenue
    FROM customer_purchases
    WHERE agent_id = p_agent_id
      AND workspace_id = p_workspace_id
      AND (p_project_id IS NULL OR project_id = p_project_id)
  )
  SELECT jsonb_build_object(
    'today', jsonb_build_object(
      'interaction_units', i.today_units,
      'interaction_revenue', i.today_revenue,
      'daily_units', d.today_units,
      'daily_revenue', d.today_revenue,
      'giveaway_count', g.today_count,
      'giveaway_items', g.today_items,
      'wholesale_units', w.today_units,
      'wholesale_revenue', w.today_revenue
    ),
    'week', jsonb_build_object(
      'interaction_units', i.week_units,
      'interaction_revenue', i.week_revenue,
      'daily_units', d.week_units,
      'daily_revenue', d.week_revenue,
      'giveaway_count', g.week_count,
      'giveaway_items', g.week_items,
      'wholesale_units', w.week_units,
      'wholesale_revenue', w.week_revenue
    ),
    'all_time', jsonb_build_object(
      'interaction_units', i.all_time_units,
      'interaction_revenue', i.all_time_revenue,
      'daily_units', d.all_time_units,
      'daily_revenue', d.all_time_revenue,
      'giveaway_count', g.all_time_count,
      'giveaway_items', g.all_time_items,
      'wholesale_units', w.all_time_units,
      'wholesale_revenue', w.all_time_revenue
    )
  )
  FROM interaction_sales i, daily_sales d, giveaway_stats g, wholesale_stats w;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_metric_aggregates(
  uuid, uuid, uuid, timestamptz, timestamptz, date, date
) TO authenticated;
