-- Extend offline sync: report_kind, notes, surveys, stores, price reports

ALTER TABLE public.daily_stock_reports
  ADD COLUMN IF NOT EXISTS report_kind TEXT NOT NULL DEFAULT 'availability';

ALTER TABLE public.daily_stock_reports
  DROP CONSTRAINT IF EXISTS daily_stock_reports_natural_key;

DROP INDEX IF EXISTS daily_stock_reports_natural_key;

CREATE UNIQUE INDEX IF NOT EXISTS daily_stock_reports_natural_key
  ON public.daily_stock_reports (
    agent_id,
    work_date,
    product_variant_id,
    report_type,
    report_kind,
    COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS notes_client_op_unique
  ON public.notes (client_operation_id)
  WHERE client_operation_id IS NOT NULL;

ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS survey_responses_client_op_unique
  ON public.survey_responses (client_operation_id)
  WHERE client_operation_id IS NOT NULL;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS stores_client_op_unique
  ON public.stores (client_operation_id)
  WHERE client_operation_id IS NOT NULL;

ALTER TABLE public.store_price_reports
  ADD COLUMN IF NOT EXISTS client_operation_id UUID;

ALTER TABLE public.store_price_reports
  ADD COLUMN IF NOT EXISTS measurement TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS store_price_reports_natural_key
  ON public.store_price_reports (
    agent_id,
    work_date,
    product_variant_id,
    COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Replace sync_daily_stock_reports to honor reportKind
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
  v_report_kind TEXT;
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

  v_report_kind := COALESCE(p_payload ->> 'reportKind', 'availability');

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_payload -> 'rows')
  LOOP
    v_store := NULLIF(p_payload ->> 'storeId', '')::UUID;
    INSERT INTO public.daily_stock_reports (
      agent_id, product_variant_id, stock_level, opening_stock,
      quantity_sold, closing_stock, report_type, report_kind, work_date,
      workspace_id, store_id, client_operation_id
    ) VALUES (
      v_agent_id,
      (v_row ->> 'product_variant_id')::UUID,
      v_row ->> 'stock_level',
      NULLIF(v_row ->> 'opening_stock', '')::INTEGER,
      NULLIF(v_row ->> 'quantity_sold', '')::INTEGER,
      NULLIF(v_row ->> 'closing_stock', '')::INTEGER,
      p_payload ->> 'reportType',
      v_report_kind,
      p_payload ->> 'workDate',
      p_workspace_id,
      v_store,
      p_client_operation_id
    )
    ON CONFLICT (
      agent_id, work_date, product_variant_id, report_type, report_kind,
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

CREATE OR REPLACE FUNCTION public.sync_store_price_reports(
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

  v_store := NULLIF(p_payload ->> 'storeId', '')::UUID;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_payload -> 'rows')
  LOOP
    INSERT INTO public.store_price_reports (
      agent_id, store_id, product_variant_id, price, stock_level,
      measurement, work_date, workspace_id, client_operation_id
    ) VALUES (
      v_agent_id,
      v_store,
      (v_row ->> 'product_variant_id')::UUID,
      COALESCE((v_row ->> 'price')::NUMERIC, 0),
      v_row ->> 'stock_level',
      v_row ->> 'measurement',
      COALESCE((p_payload ->> 'workDate')::DATE, CURRENT_DATE),
      p_workspace_id,
      p_client_operation_id
    )
    ON CONFLICT (
      agent_id, work_date, product_variant_id,
      COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    DO UPDATE SET
      price = EXCLUDED.price,
      stock_level = EXCLUDED.stock_level,
      measurement = EXCLUDED.measurement,
      client_operation_id = EXCLUDED.client_operation_id;
  END LOOP;

  v_existing := jsonb_build_object('success', true);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'price_report', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_field_note(
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

  INSERT INTO public.notes (agent_id, workspace_id, content, note_type, client_operation_id)
  VALUES (
    v_agent_id,
    p_workspace_id,
    p_payload ->> 'content',
    COALESCE(p_payload ->> 'noteType', 'field'),
    p_client_operation_id
  );

  v_existing := jsonb_build_object('success', true);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'field_note', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_record_survey(
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
  v_interaction_id UUID;
  v_points INTEGER;
  v_task_id UUID;
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

  v_task_id := NULLIF(p_payload ->> 'taskId', '')::UUID;
  IF v_task_id IS NULL THEN
    SELECT id INTO v_task_id
    FROM public.agent_tasks
    WHERE agent_id = v_agent_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  v_points := COALESCE((p_payload ->> 'points')::INTEGER, 20);

  INSERT INTO public.interactions (
    task_id, agent_id, interaction_type, survey_template_id, store_id,
    customer_name, outcome, quantity_sold, latitude, longitude, timestamp,
    workspace_id, metadata
  ) VALUES (
    v_task_id,
    v_agent_id,
    'survey',
    (p_payload ->> 'surveyTemplateId')::UUID,
    NULLIF(p_payload ->> 'storeId', '')::UUID,
    p_payload ->> 'storeName',
    'completed',
    0,
    NULLIF(p_payload ->> 'locationLat', '')::NUMERIC,
    NULLIF(p_payload ->> 'locationLng', '')::NUMERIC,
    COALESCE((p_payload ->> 'completedAt')::TIMESTAMPTZ, now()),
    p_workspace_id,
    jsonb_build_object(
      'survey_template_id', p_payload ->> 'surveyTemplateId',
      'recordingUrl', p_payload ->> 'audioUrl',
      'client_operation_id', p_client_operation_id
    )
  )
  RETURNING id INTO v_interaction_id;

  INSERT INTO public.survey_responses (
    agent_id, survey_template_id, interaction_id, responses,
    started_at, completed_at, duration_seconds, completion_time_seconds,
    is_completed, completion_status, location_lat, location_lng,
    workspace_id, client_operation_id
  ) VALUES (
    v_agent_id,
    (p_payload ->> 'surveyTemplateId')::UUID,
    v_interaction_id,
    COALESCE(p_payload -> 'responses', '{}'::jsonb),
    (p_payload ->> 'startedAt')::TIMESTAMPTZ,
    COALESCE((p_payload ->> 'completedAt')::TIMESTAMPTZ, now()),
    COALESCE((p_payload ->> 'durationSeconds')::INTEGER, 0),
    COALESCE((p_payload ->> 'durationSeconds')::INTEGER, 0),
    true,
    'completed',
    NULLIF(p_payload ->> 'locationLat', '')::NUMERIC,
    NULLIF(p_payload ->> 'locationLng', '')::NUMERIC,
    p_workspace_id,
    p_client_operation_id
  );

  INSERT INTO public.agent_actions (
    agent_id, action_type, points_earned, workspace_id, action_data
  ) VALUES (
    v_agent_id,
    'survey_completed',
    v_points,
    p_workspace_id,
    jsonb_build_object(
      'survey_type', p_payload ->> 'surveyName',
      'survey_template_id', p_payload ->> 'surveyTemplateId',
      'interaction_id', v_interaction_id,
      'client_operation_id', p_client_operation_id
    )
  );

  v_existing := jsonb_build_object('success', true, 'interaction_id', v_interaction_id);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'survey_response', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_create_store(
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
  v_store_id UUID;
  v_project_id UUID;
  v_stores JSONB;
  v_store_text TEXT;
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

  INSERT INTO public.stores (
    store_name, county, store_lat, store_long, contact, added_by,
    workspace_id, country, client_operation_id
  ) VALUES (
    p_payload ->> 'storeName',
    NULLIF(p_payload ->> 'county', ''),
    (p_payload ->> 'latitude')::NUMERIC,
    (p_payload ->> 'longitude')::NUMERIC,
    NULLIF(p_payload ->> 'contact', ''),
    v_agent_id,
    p_workspace_id,
    NULLIF(p_payload ->> 'country', ''),
    p_client_operation_id
  )
  RETURNING id INTO v_store_id;

  SELECT id INTO v_project_id
  FROM public.project_plans
  WHERE workspace_id = p_workspace_id
    AND status = 'active'
    AND is_deleted = false
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_project_id IS NOT NULL THEN
    SELECT target_stores INTO v_stores
    FROM public.project_plans
    WHERE id = v_project_id;

    v_store_text := v_store_id::TEXT;
    IF v_stores IS NULL OR jsonb_typeof(v_stores) != 'array' THEN
      v_stores := jsonb_build_array(v_store_text);
    ELSIF NOT v_stores @> to_jsonb(v_store_text) THEN
      v_stores := v_stores || to_jsonb(v_store_text);
    END IF;

    UPDATE public.project_plans
    SET target_stores = v_stores
    WHERE id = v_project_id;
  END IF;

  v_existing := jsonb_build_object('success', true, 'store_id', v_store_id);

  INSERT INTO public.client_sync_operations (id, agent_id, workspace_id, operation_type, result)
  VALUES (p_client_operation_id, v_agent_id, p_workspace_id, 'store_create', v_existing)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_existing;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_store_price_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_field_note TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_record_survey TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_create_store TO authenticated;
