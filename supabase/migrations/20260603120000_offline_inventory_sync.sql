-- Offline sync: idempotency keys and transactional apply RPCs

CREATE TABLE IF NOT EXISTS public.client_sync_operations (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_sync_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage own sync operations"
ON public.client_sync_operations
FOR ALL
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_transactions_client_op_product_unique
  ON public.inventory_transactions (client_operation_id, product_id)
  WHERE client_operation_id IS NOT NULL;

ALTER TABLE public.giveaways
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS giveaways_client_op_unique
  ON public.giveaways (client_operation_id)
  WHERE client_operation_id IS NOT NULL;

ALTER TABLE public.daily_stock_reports
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

ALTER TABLE public.interactions
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

ALTER TABLE public.agent_task_inventory
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS daily_stock_reports_natural_key
  ON public.daily_stock_reports (
    agent_id,
    work_date,
    product_variant_id,
    report_type,
    COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Available qty: issued minus outbound ledger (sales/giveaways)
CREATE OR REPLACE FUNCTION public.get_agent_available_qty(
  p_agent_id UUID,
  p_product_id UUID,
  p_workspace_id UUID
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT GREATEST(
    0,
    COALESCE((
      SELECT SUM(ati.amount_issued)::INTEGER
      FROM public.agent_task_inventory ati
      INNER JOIN public.agent_tasks at ON at.id = ati.task_id
      WHERE ati.agent_id = p_agent_id
        AND ati.product_variant_id = p_product_id
        AND ati.is_deleted IS NOT TRUE
        AND at.is_deleted IS NOT TRUE
        AND at.workspace_id = p_workspace_id
    ), 0)
    + COALESCE((
      SELECT SUM(it.qty)::INTEGER
      FROM public.inventory_transactions it
      WHERE it.agent_id = p_agent_id
        AND it.product_id = p_product_id
        AND it.workspace_id = p_workspace_id
        AND it.is_deleted IS NOT TRUE
        AND it.qty < 0
    ), 0)
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_record_sale_batch(
  p_client_operation_id UUID,
  p_workspace_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID := auth.uid();
  v_existing JSONB;
  v_items JSONB;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_line_total NUMERIC;
  v_total NUMERIC := 0;
  v_task_id UUID;
  v_points INTEGER;
BEGIN
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT result INTO v_existing
  FROM public.client_sync_operations
  WHERE id = p_client_operation_id AND agent_id = v_agent_id;

  IF FOUND AND v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_items := p_payload -> 'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No sale items');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := (v_item ->> 'productVariantId')::UUID;
    v_qty := COALESCE((v_item ->> 'quantity')::INTEGER, 0);
    IF v_qty <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity');
    END IF;
    IF public.get_agent_available_qty(v_agent_id, v_product_id, p_workspace_id) < v_qty THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient stock for product ' || v_product_id::TEXT
      );
    END IF;
  END LOOP;

  SELECT id INTO v_task_id
  FROM public.agent_tasks
  WHERE agent_id = v_agent_id AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF (p_payload ->> 'taskId') IS NOT NULL THEN
    v_task_id := (p_payload ->> 'taskId')::UUID;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_product_id := (v_item ->> 'productVariantId')::UUID;
    v_qty := (v_item ->> 'quantity')::INTEGER;
    v_line_total := COALESCE(
      (v_item ->> 'lineTotal')::NUMERIC,
      (v_item ->> 'price')::NUMERIC * v_qty
    );
    v_total := v_total + v_line_total;

    INSERT INTO public.interactions (
      task_id, agent_id, interaction_type, customer_name, customer_phone,
      product_variant_id, quantity_sold, sale_value, outcome, workspace_id,
      store_id, latitude, longitude, timestamp, image_url, client_operation_id, metadata
    ) VALUES (
      v_task_id,
      v_agent_id,
      'sale',
      COALESCE(p_payload ->> 'customerName', p_payload ->> 'storeName'),
      p_payload ->> 'customerPhone',
      v_product_id,
      v_qty,
      v_line_total,
      CASE WHEN (p_payload ->> 'storeId') IS NOT NULL THEN 'completed' ELSE 'sale' END,
      p_workspace_id,
      NULLIF(p_payload ->> 'storeId', '')::UUID,
      NULLIF(p_payload ->> 'latitude', '')::NUMERIC,
      NULLIF(p_payload ->> 'longitude', '')::NUMERIC,
      now(),
      p_payload ->> 'imageUrl',
      p_client_operation_id,
      jsonb_build_object(
        'engagement_type', p_payload ->> 'engagementType',
        'notes', p_payload ->> 'notes',
        'sentiment', p_payload ->> 'sentiment',
        'customer_email', p_payload ->> 'customerEmail'
      )
    );

    INSERT INTO public.inventory_transactions (
      agent_id, product_id, qty, type, reference, workspace_id,
      client_operation_id, metadata
    ) VALUES (
      v_agent_id,
      v_product_id,
      -v_qty,
      'sale',
      'Sale to ' || COALESCE(p_payload ->> 'customerName', p_payload ->> 'storeName', 'Customer'),
      p_workspace_id,
      p_client_operation_id,
      jsonb_build_object('task_id', v_task_id, 'sale_value', v_line_total)
    );
  END LOOP;

  v_points := GREATEST(FLOOR(v_total / 10) * 5, 25);

  INSERT INTO public.agent_actions (
    agent_id, action_type, points_earned, workspace_id, action_data
  ) VALUES (
    v_agent_id,
    'sale_recorded',
    v_points,
    p_workspace_id,
    jsonb_build_object(
      'total_value', v_total,
      'customer_name', p_payload ->> 'customerName',
      'items_count', jsonb_array_length(v_items),
      'client_operation_id', p_client_operation_id
    )
  );

  v_existing := jsonb_build_object('success', true, 'points_earned', v_points);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'sale_batch', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_record_giveaway(
  p_client_operation_id UUID,
  p_workspace_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID := auth.uid();
  v_existing JSONB;
  v_products JSONB;
  v_product JSONB;
  v_product_id UUID;
  v_qty INTEGER;
BEGIN
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT result INTO v_existing
  FROM public.client_sync_operations
  WHERE id = p_client_operation_id AND agent_id = v_agent_id;

  IF FOUND AND v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_products := p_payload -> 'productsGiven';
  FOR v_product IN SELECT * FROM jsonb_array_elements(v_products)
  LOOP
    v_product_id := (v_product ->> 'product_variant_id')::UUID;
    v_qty := COALESCE((v_product ->> 'quantity')::INTEGER, 0);
    IF public.get_agent_available_qty(v_agent_id, v_product_id, p_workspace_id) < v_qty THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock for giveaway');
    END IF;
  END LOOP;

  INSERT INTO public.giveaways (
    agent_id, workspace_id, products_given, total_items,
    recipient_name, recipient_phone, notes,
    location_lat, location_lng, store_id, project_id, recorded_at, client_operation_id
  ) VALUES (
    v_agent_id,
    p_workspace_id,
    v_products,
    COALESCE((p_payload ->> 'totalItems')::INTEGER, 0),
    p_payload ->> 'recipientName',
    p_payload ->> 'recipientPhone',
    p_payload ->> 'notes',
    NULLIF(p_payload ->> 'locationLat', '')::NUMERIC,
    NULLIF(p_payload ->> 'locationLng', '')::NUMERIC,
    NULLIF(p_payload ->> 'storeId', '')::UUID,
    NULLIF(p_payload ->> 'projectId', '')::UUID,
    COALESCE((p_payload ->> 'recordedAt')::TIMESTAMPTZ, now()),
    p_client_operation_id
  );

  FOR v_product IN SELECT * FROM jsonb_array_elements(v_products)
  LOOP
    v_product_id := (v_product ->> 'product_variant_id')::UUID;
    v_qty := (v_product ->> 'quantity')::INTEGER;
    INSERT INTO public.inventory_transactions (
      agent_id, product_id, qty, type, reference, workspace_id, client_operation_id
    ) VALUES (
      v_agent_id, v_product_id, -v_qty, 'giveaway',
      'Giveaway to ' || COALESCE(p_payload ->> 'recipientName', 'Recipient'),
      p_workspace_id, p_client_operation_id
    );
  END LOOP;

  v_existing := jsonb_build_object('success', true);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'giveaway', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_daily_stock_reports(
  p_client_operation_id UUID,
  p_workspace_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID := auth.uid();
  v_existing JSONB;
  v_row JSONB;
  v_store UUID;
BEGIN
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT result INTO v_existing
  FROM public.client_sync_operations
  WHERE id = p_client_operation_id AND agent_id = v_agent_id;

  IF FOUND AND v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_payload -> 'rows')
  LOOP
    v_store := NULLIF(p_payload ->> 'storeId', '')::UUID;
    INSERT INTO public.daily_stock_reports (
      agent_id, product_variant_id, stock_level, opening_stock,
      quantity_sold, closing_stock, report_type, work_date,
      workspace_id, store_id, client_operation_id
    ) VALUES (
      v_agent_id,
      (v_row ->> 'product_variant_id')::UUID,
      v_row ->> 'stock_level',
      NULLIF(v_row ->> 'opening_stock', '')::INTEGER,
      NULLIF(v_row ->> 'quantity_sold', '')::INTEGER,
      NULLIF(v_row ->> 'closing_stock', '')::INTEGER,
      p_payload ->> 'reportType',
      p_payload ->> 'workDate',
      p_workspace_id,
      v_store,
      p_client_operation_id
    )
    ON CONFLICT (
      agent_id, work_date, product_variant_id, report_type,
      COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    DO UPDATE SET
      stock_level = EXCLUDED.stock_level,
      opening_stock = EXCLUDED.opening_stock,
      quantity_sold = EXCLUDED.quantity_sold,
      closing_stock = EXCLUDED.closing_stock,
      client_operation_id = EXCLUDED.client_operation_id;
  END LOOP;

  v_existing := jsonb_build_object('success', true);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'stock_report', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_inventory_assign(
  p_client_operation_id UUID,
  p_workspace_id UUID,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID := auth.uid();
  v_existing JSONB;
  v_entry JSONB;
BEGIN
  IF v_agent_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT result INTO v_existing
  FROM public.client_sync_operations
  WHERE id = p_client_operation_id AND agent_id = v_agent_id;

  IF FOUND AND v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  FOR v_entry IN SELECT * FROM jsonb_array_elements(p_payload -> 'entries')
  LOOP
    INSERT INTO public.agent_task_inventory (
      agent_id, product_variant_id, amount_issued, name, client_operation_id
    ) VALUES (
      v_agent_id,
      (v_entry ->> 'productVariantId')::UUID,
      (v_entry ->> 'quantity')::INTEGER,
      v_entry ->> 'name',
      p_client_operation_id
    );
  END LOOP;

  v_existing := jsonb_build_object('success', true);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'inventory_assign', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_available_qty TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_record_sale_batch TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_record_giveaway TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_daily_stock_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_inventory_assign TO authenticated;
