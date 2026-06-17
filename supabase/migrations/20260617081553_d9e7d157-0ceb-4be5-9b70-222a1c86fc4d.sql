
-- 1) Idempotency tracking table
CREATE TABLE IF NOT EXISTS public.client_sync_operations (
  id uuid PRIMARY KEY,
  workspace_id uuid,
  agent_id uuid,
  operation_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_sync_operations TO authenticated;
GRANT ALL ON public.client_sync_operations TO service_role;

-- 2) Add client_operation_id to stores for store_create idempotency
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS client_operation_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS stores_client_operation_id_key
  ON public.stores(client_operation_id) WHERE client_operation_id IS NOT NULL;

-- Helper: mark op done (called at end of each sync function)
CREATE OR REPLACE FUNCTION public._mark_sync_op(p_id uuid, p_workspace_id uuid, p_agent_id uuid, p_type text)
RETURNS void LANGUAGE sql AS $$
  INSERT INTO public.client_sync_operations(id, workspace_id, agent_id, operation_type)
  VALUES (p_id, p_workspace_id, p_agent_id, p_type)
  ON CONFLICT (id) DO NOTHING;
$$;

-- 3) sync_record_sale_batch
CREATE OR REPLACE FUNCTION public.sync_record_sale_batch(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_task_id uuid;
  v_item jsonb;
  v_line_total numeric;
  v_total numeric := 0;
  v_customer_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  v_task_id := NULLIF(p_payload->>'taskId','')::uuid;
  IF v_task_id IS NULL THEN
    SELECT id INTO v_task_id FROM agent_tasks
      WHERE agent_id = v_user AND status = 'pending' LIMIT 1;
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
    v_line_total := COALESCE((v_item->>'lineTotal')::numeric,
                             (v_item->>'price')::numeric * (v_item->>'quantity')::numeric);
    v_total := v_total + v_line_total;

    INSERT INTO interactions(
      task_id, agent_id, interaction_type, customer_name, customer_phone,
      product_variant_id, quantity_sold, sale_value, outcome,
      workspace_id, store_id, latitude, longitude, timestamp, image_url, metadata
    ) VALUES (
      v_task_id, v_user, 'sale',
      COALESCE(p_payload->>'customerName', p_payload->>'storeName'),
      p_payload->>'customerPhone',
      (v_item->>'productVariantId')::uuid,
      (v_item->>'quantity')::numeric,
      v_line_total,
      CASE WHEN p_payload->>'storeId' IS NOT NULL THEN 'completed' ELSE 'sale' END,
      p_workspace_id,
      NULLIF(p_payload->>'storeId','')::uuid,
      NULLIF(p_payload->>'latitude','')::numeric,
      NULLIF(p_payload->>'longitude','')::numeric,
      now(),
      p_payload->>'imageUrl',
      jsonb_build_object(
        'engagement_type', p_payload->>'engagementType',
        'notes', p_payload->>'notes',
        'sentiment', p_payload->'sentiment',
        'customer_email', p_payload->>'customerEmail',
        'client_operation_id', p_client_operation_id
      )
    );

    INSERT INTO inventory_transactions(
      agent_id, product_id, qty, type, reference, metadata, workspace_id
    ) VALUES (
      v_user, (v_item->>'productVariantId')::uuid,
      -(v_item->>'quantity')::integer, 'sale',
      'Sale to ' || COALESCE(p_payload->>'customerName', p_payload->>'storeName', 'Customer'),
      jsonb_build_object(
        'task_id', v_task_id, 'sale_value', v_line_total,
        'line_product_id', (v_item->>'productVariantId')::uuid,
        'client_operation_id', p_client_operation_id
      ),
      p_workspace_id
    );
  END LOOP;

  v_customer_id := NULLIF(p_payload->>'customerId','')::uuid;
  IF v_customer_id IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'items') LOOP
      INSERT INTO customer_purchases(
        customer_id, agent_id, product_variant_id, quantity, total_value,
        location_lat, location_lng, workspace_id, project_id
      ) VALUES (
        v_customer_id, v_user, (v_item->>'productVariantId')::uuid,
        (v_item->>'quantity')::integer,
        COALESCE((v_item->>'lineTotal')::numeric, (v_item->>'price')::numeric * (v_item->>'quantity')::numeric),
        NULLIF(p_payload->>'latitude','')::numeric,
        NULLIF(p_payload->>'longitude','')::numeric,
        p_workspace_id,
        NULLIF(p_payload->>'projectId','')::uuid
      );
    END LOOP;
  END IF;

  INSERT INTO agent_actions(agent_id, action_type, points_earned, action_data, workspace_id)
  VALUES (
    v_user, 'sale_recorded',
    GREATEST(FLOOR(v_total / 10)::int * 5, 25),
    jsonb_build_object(
      'total_value', v_total,
      'customer_name', p_payload->>'customerName',
      'items_count', jsonb_array_length(p_payload->'items'),
      'client_operation_id', p_client_operation_id
    ),
    p_workspace_id
  );

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'sale_batch');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4) sync_record_giveaway
CREATE OR REPLACE FUNCTION public.sync_record_giveaway(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_p jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO giveaways(
    agent_id, products_given, total_items, recipient_name, recipient_phone, notes,
    location_lat, location_lng, workspace_id, project_id, store_id, recorded_at
  ) VALUES (
    v_user,
    COALESCE(p_payload->'productsGiven', '[]'::jsonb),
    COALESCE((p_payload->>'totalItems')::int, 0),
    p_payload->>'recipientName',
    p_payload->>'recipientPhone',
    p_payload->>'notes',
    NULLIF(p_payload->>'locationLat','')::numeric,
    NULLIF(p_payload->>'locationLng','')::numeric,
    p_workspace_id,
    NULLIF(p_payload->>'projectId','')::uuid,
    NULLIF(p_payload->>'storeId','')::uuid,
    COALESCE(NULLIF(p_payload->>'recordedAt','')::timestamptz, now())
  );

  FOR v_p IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'productsGiven','[]'::jsonb)) LOOP
    INSERT INTO inventory_transactions(agent_id, product_id, qty, type, reference, metadata, workspace_id)
    VALUES (
      v_user, (v_p->>'product_variant_id')::uuid,
      -(v_p->>'quantity')::int, 'giveaway',
      'Giveaway to ' || COALESCE(p_payload->>'recipientName', 'Recipient'),
      jsonb_build_object('product_variant_id', v_p->>'product_variant_id', 'client_operation_id', p_client_operation_id),
      p_workspace_id
    );
  END LOOP;

  IF p_payload ? 'saveCustomer' THEN
    INSERT INTO customers(name, phone, location_lat, location_lng, workspace_id)
    VALUES (
      p_payload->'saveCustomer'->>'name',
      p_payload->'saveCustomer'->>'phone',
      NULLIF(p_payload->'saveCustomer'->>'location_lat','')::numeric,
      NULLIF(p_payload->'saveCustomer'->>'location_lng','')::numeric,
      p_workspace_id
    );
  END IF;

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'giveaway');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 5) sync_daily_stock_reports
CREATE OR REPLACE FUNCTION public.sync_daily_stock_reports(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'rows','[]'::jsonb)) LOOP
    INSERT INTO daily_stock_reports(
      agent_id, product_variant_id, stock_level, report_type,
      work_date, workspace_id, store_id
    ) VALUES (
      v_user,
      (v_row->>'product_variant_id')::uuid,
      v_row->>'stock_level',
      p_payload->>'reportType',
      (p_payload->>'workDate')::date,
      p_workspace_id,
      NULLIF(p_payload->>'storeId','')::uuid
    );
  END LOOP;

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'stock_report');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6) sync_inventory_assign
CREATE OR REPLACE FUNCTION public.sync_inventory_assign(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_e jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  FOR v_e IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'entries','[]'::jsonb)) LOOP
    INSERT INTO agent_task_inventory(agent_id, product_variant_id, amount_issued, name, task_id)
    VALUES (
      v_user,
      (v_e->>'productVariantId')::uuid,
      (v_e->>'quantity')::int,
      v_e->>'name',
      COALESCE(NULLIF(p_payload->>'taskId','')::uuid, gen_random_uuid())
    );
  END LOOP;

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'inventory_assign');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 7) sync_create_store
CREATE OR REPLACE FUNCTION public.sync_create_store(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_store_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;

  SELECT id INTO v_store_id FROM stores WHERE client_operation_id = p_client_operation_id LIMIT 1;
  IF v_store_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'store_id', v_store_id);
  END IF;

  INSERT INTO stores(
    store_name, county, store_lat, store_long, contact, added_by,
    workspace_id, country, client_operation_id
  ) VALUES (
    p_payload->>'storeName',
    NULLIF(p_payload->>'county',''),
    (p_payload->>'latitude')::numeric,
    (p_payload->>'longitude')::numeric,
    p_payload->>'contact',
    v_user,
    p_workspace_id,
    NULLIF(p_payload->>'country',''),
    p_client_operation_id
  ) RETURNING id INTO v_store_id;

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'store_create');
  RETURN jsonb_build_object('success', true, 'store_id', v_store_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 8) sync_field_note
CREATE OR REPLACE FUNCTION public.sync_field_note(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO notes(agent_id, workspace_id, content, note_type)
  VALUES (v_user, p_workspace_id, p_payload->>'content', COALESCE(p_payload->>'noteType','field'));

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'field_note');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 9) sync_store_price_reports
CREATE OR REPLACE FUNCTION public.sync_store_price_reports(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row jsonb;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(p_payload->'rows','[]'::jsonb)) LOOP
    INSERT INTO store_price_reports(
      agent_id, store_id, product_variant_id, price, stock_level, work_date, workspace_id
    ) VALUES (
      v_user,
      NULLIF(p_payload->>'storeId','')::uuid,
      (v_row->>'product_variant_id')::uuid,
      (v_row->>'price')::numeric,
      v_row->>'stock_level',
      (p_payload->>'workDate')::date,
      p_workspace_id
    );
  END LOOP;

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'price_report');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 10) sync_record_survey
CREATE OR REPLACE FUNCTION public.sync_record_survey(
  p_client_operation_id uuid, p_workspace_id uuid, p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_interaction_id uuid;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
  IF EXISTS (SELECT 1 FROM client_sync_operations WHERE id = p_client_operation_id) THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO interactions(
    task_id, agent_id, interaction_type, outcome, quantity_sold,
    workspace_id, store_id, customer_name, latitude, longitude, metadata
  ) VALUES (
    NULLIF(p_payload->>'taskId','')::uuid,
    v_user, 'survey', 'completed', 0,
    p_workspace_id,
    NULLIF(p_payload->>'storeId','')::uuid,
    p_payload->>'storeName',
    NULLIF(p_payload->>'locationLat','')::numeric,
    NULLIF(p_payload->>'locationLng','')::numeric,
    jsonb_build_object(
      'survey_template_id', p_payload->>'surveyTemplateId',
      'recordingUrl', p_payload->>'audioUrl',
      'client_operation_id', p_client_operation_id
    )
  ) RETURNING id INTO v_interaction_id;

  INSERT INTO survey_responses(
    agent_id, survey_template_id, interaction_id, responses,
    started_at, completed_at, duration_seconds, completion_time_seconds,
    is_completed, completion_status, location_lat, location_lng, workspace_id
  ) VALUES (
    v_user,
    (p_payload->>'surveyTemplateId')::uuid,
    v_interaction_id,
    COALESCE(p_payload->'responses', '{}'::jsonb),
    NULLIF(p_payload->>'startedAt','')::timestamptz,
    NULLIF(p_payload->>'completedAt','')::timestamptz,
    (p_payload->>'durationSeconds')::int,
    (p_payload->>'durationSeconds')::int,
    true, 'completed',
    NULLIF(p_payload->>'locationLat','')::numeric,
    NULLIF(p_payload->>'locationLng','')::numeric,
    p_workspace_id
  );

  INSERT INTO agent_actions(agent_id, action_type, points_earned, action_data, workspace_id)
  VALUES (
    v_user, 'survey_completed',
    COALESCE((p_payload->>'points')::int, 20),
    jsonb_build_object(
      'survey_type', p_payload->>'surveyName',
      'survey_template_id', p_payload->>'surveyTemplateId',
      'interaction_id', v_interaction_id
    ),
    p_workspace_id
  );

  PERFORM _mark_sync_op(p_client_operation_id, p_workspace_id, v_user, 'survey_response');
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.sync_record_sale_batch(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_record_giveaway(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_daily_stock_reports(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_inventory_assign(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_create_store(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_field_note(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_store_price_reports(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_record_survey(uuid,uuid,jsonb) TO authenticated;
