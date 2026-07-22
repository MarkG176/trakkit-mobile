
CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _ws IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_workspaces
    WHERE user_id = auth.uid()
      AND workspace_id = _ws
      AND COALESCE(is_active, true) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_supervisor(_ws uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _ws IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.user_workspaces uw
    JOIN public.user_roles ur ON ur.user_id = uw.user_id
    WHERE uw.user_id = auth.uid()
      AND uw.workspace_id = _ws
      AND COALESCE(uw.is_active, true) = true
      AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_supervisor(uuid) TO authenticated, anon;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Category A: workspace + agent-owned
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'agent_actions','agent_availability','agent_device_status','agent_kpi_results',
  'agent_ranks','agent_report_summary','agent_status_log','agent_tasks',
  'agent_work_segments','checkout_requests','client_sync_operations',
  'customer_purchases','daily_sales_tracking','daily_stock_reports','giveaways',
  'interactions','inventory_sessions','inventory_transactions','notes',
  'payroll_periods','product_returns','reports','route_assignments','routes',
  'sale_items','sales','stock_reports','store_price_reports','store_visits',
  'support_tickets','survey_responses','team_members'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY "member_select_own_or_supervisor" ON public.%I FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)))$f$, t);
    EXECUTE format($f$CREATE POLICY "member_insert_own_or_supervisor" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)))$f$, t);
    EXECUTE format($f$CREATE POLICY "member_update_own_or_supervisor" ON public.%I FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR public.is_workspace_supervisor(workspace_id))) WITH CHECK (public.is_workspace_member(workspace_id) AND (agent_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Category B: workspace-scoped shared
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY[
  'analytics_metrics','apartments','areas','buildings','day_plans',
  'location_area_mappings','product_variants','products','project_report_cache',
  'projects','project_plans','stock_report_templates','survey_insight_cache',
  'survey_templates','teams','workspace_invitations'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY "member_select" ON public.%I FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_update" ON public.%I FOR UPDATE TO authenticated USING (public.is_workspace_supervisor(workspace_id)) WITH CHECK (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Shared but members can create/update
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY['stores','customers'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY "member_select" ON public.%I FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "member_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "member_update" ON public.%I FOR UPDATE TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Messages
DO $$
DECLARE t text;
DECLARE tables text[] := ARRAY['supervisor_messages','workspace_messages'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY "participants_select" ON public.%I FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "sender_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_workspace_member(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "sender_or_supervisor_update" ON public.%I FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)) WITH CHECK (sender_id = auth.uid() OR public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format($f$CREATE POLICY "supervisor_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id))$f$, t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- user_workspaces
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.user_workspaces FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "self_insert" ON public.user_workspaces FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "self_or_supervisor_update" ON public.user_workspaces FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)) WITH CHECK (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "supervisor_delete" ON public.user_workspaces FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_workspaces TO authenticated;
GRANT ALL ON public.user_workspaces TO service_role;

-- user_app_user_connections
ALTER TABLE public.user_app_user_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_all" ON public.user_app_user_connections FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_app_user_connections TO authenticated;
GRANT ALL ON public.user_app_user_connections TO service_role;

-- google_oauth_tokens
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_all" ON public.google_oauth_tokens FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_oauth_tokens TO authenticated;
GRANT ALL ON public.google_oauth_tokens TO service_role;

-- google_invite_forms
ALTER TABLE public.google_invite_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_or_supervisor_select" ON public.google_invite_forms FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "member_insert" ON public.google_invite_forms FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_workspace_member(workspace_id));
CREATE POLICY "creator_or_supervisor_update" ON public.google_invite_forms FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id)) WITH CHECK (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "supervisor_delete" ON public.google_invite_forms FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_invite_forms TO authenticated;
GRANT ALL ON public.google_invite_forms TO service_role;

-- google_sheet_links
ALTER TABLE public.google_sheet_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_or_supervisor_select" ON public.google_sheet_links FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "member_insert" ON public.google_sheet_links FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_workspace_member(workspace_id));
CREATE POLICY "creator_or_supervisor_update" ON public.google_sheet_links FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id)) WITH CHECK (created_by = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "supervisor_delete" ON public.google_sheet_links FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sheet_links TO authenticated;
GRANT ALL ON public.google_sheet_links TO service_role;

-- device_push_tokens
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_all" ON public.device_push_tokens FOR ALL TO authenticated USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_push_tokens TO authenticated;
GRANT ALL ON public.device_push_tokens TO service_role;

-- agent_task_inventory
ALTER TABLE public.agent_task_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.agent_task_inventory FOR SELECT TO authenticated USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
CREATE POLICY "supervisor_write" ON public.agent_task_inventory FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_task_inventory TO authenticated;
GRANT ALL ON public.agent_task_inventory TO service_role;

-- project_assignments
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.project_assignments FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
CREATE POLICY "supervisor_write" ON public.project_assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_assignments TO authenticated;
GRANT ALL ON public.project_assignments TO service_role;

-- project_inventory (project_id only)
ALTER TABLE public.project_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.project_inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_inventory TO authenticated;
GRANT ALL ON public.project_inventory TO service_role;

-- activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id));
CREATE POLICY "self_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

-- login_events
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.login_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
CREATE POLICY "self_insert" ON public.login_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
GRANT SELECT, INSERT ON public.login_events TO authenticated;
GRANT INSERT ON public.login_events TO anon;
GRANT ALL ON public.login_events TO service_role;

-- security_audit_log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supervisor_select" ON public.security_audit_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
CREATE POLICY "self_insert" ON public.security_audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
GRANT SELECT, INSERT ON public.security_audit_log TO authenticated;
GRANT ALL ON public.security_audit_log TO service_role;

-- stock_movements (user_id, workspace_id)
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_select_own_or_supervisor" ON public.stock_movements FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id) AND (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)));
CREATE POLICY "member_insert" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(workspace_id) AND (user_id = auth.uid() OR public.is_workspace_supervisor(workspace_id)));
CREATE POLICY "supervisor_update" ON public.stock_movements FOR UPDATE TO authenticated USING (public.is_workspace_supervisor(workspace_id)) WITH CHECK (public.is_workspace_supervisor(workspace_id));
CREATE POLICY "supervisor_delete" ON public.stock_movements FOR DELETE TO authenticated USING (public.is_workspace_supervisor(workspace_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

-- workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_select" ON public.workspaces FOR SELECT TO authenticated USING (public.is_workspace_member(id));
CREATE POLICY "creator_insert" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "supervisor_update" ON public.workspaces FOR UPDATE TO authenticated USING (public.is_workspace_supervisor(id)) WITH CHECK (public.is_workspace_supervisor(id));
CREATE POLICY "supervisor_delete" ON public.workspaces FOR DELETE TO authenticated USING (public.is_workspace_supervisor(id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;

-- user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
CREATE POLICY "self_update_profile" ON public.user_roles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- tasks (ambassador_id)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self_or_supervisor_all" ON public.tasks FOR ALL TO authenticated USING (ambassador_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role))) WITH CHECK (ambassador_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

-- kpis
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select" ON public.kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY "supervisor_write" ON public.kpis FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpis TO authenticated;
GRANT ALL ON public.kpis TO service_role;

-- team_kpi_results
ALTER TABLE public.team_kpi_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select" ON public.team_kpi_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "supervisor_write" ON public.team_kpi_results FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_kpi_results TO authenticated;
GRANT ALL ON public.team_kpi_results TO service_role;

-- survey_answers, survey_questions (linked via response/survey, permissive for authenticated)
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.survey_answers FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_answers TO authenticated;
GRANT ALL ON public.survey_answers TO service_role;

ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.survey_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_questions TO authenticated;
GRANT ALL ON public.survey_questions TO service_role;

-- demo_requests
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON public.demo_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "supervisor_select" ON public.demo_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('supervisor'::app_role, 'admin'::app_role)));
GRANT INSERT ON public.demo_requests TO anon, authenticated;
GRANT SELECT ON public.demo_requests TO authenticated;
GRANT ALL ON public.demo_requests TO service_role;
