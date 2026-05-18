
-- 1. Column
ALTER TABLE public.user_workspaces
  ADD COLUMN IF NOT EXISTS active_components jsonb;

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.compute_user_workspace_active_components(
  p_user_id uuid,
  p_workspace_id uuid
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.mobile_components
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  JOIN public.project_plans pp ON pp.id = t.project_id
  WHERE tm.agent_id = p_user_id
    AND t.workspace_id = p_workspace_id
    AND COALESCE(tm.is_active, true) = true
    AND COALESCE(tm.is_deleted, false) = false
    AND COALESCE(t.is_active, true) = true
    AND COALESCE(t.is_deleted, false) = false
  ORDER BY tm.created_at DESC
  LIMIT 1;
$$;

-- 3. Trigger: team_members changes
CREATE OR REPLACE FUNCTION public.sync_active_components_from_team_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id uuid;
  v_team_id uuid;
  v_workspace_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_agent_id := OLD.agent_id;
    v_team_id := OLD.team_id;
  ELSE
    v_agent_id := NEW.agent_id;
    v_team_id := NEW.team_id;
  END IF;

  SELECT workspace_id INTO v_workspace_id FROM public.teams WHERE id = v_team_id;
  IF v_workspace_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.user_workspaces
  SET active_components = public.compute_user_workspace_active_components(v_agent_id, v_workspace_id)
  WHERE user_id = v_agent_id AND workspace_id = v_workspace_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_active_components_on_team_member ON public.team_members;
CREATE TRIGGER trg_sync_active_components_on_team_member
AFTER INSERT OR UPDATE OR DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.sync_active_components_from_team_member();

-- 4. Trigger: teams.project_id / workspace_id changes
CREATE OR REPLACE FUNCTION public.sync_active_components_from_team()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_workspaces uw
  SET active_components = public.compute_user_workspace_active_components(uw.user_id, uw.workspace_id)
  WHERE uw.workspace_id = NEW.workspace_id
    AND uw.user_id IN (SELECT agent_id FROM public.team_members WHERE team_id = NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_active_components_on_team ON public.teams;
CREATE TRIGGER trg_sync_active_components_on_team
AFTER UPDATE OF project_id, workspace_id, is_active, is_deleted ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.sync_active_components_from_team();

-- 5. Trigger: project_plans.mobile_components changes
CREATE OR REPLACE FUNCTION public.sync_active_components_from_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_workspaces uw
  SET active_components = NEW.mobile_components
  WHERE (uw.user_id, uw.workspace_id) IN (
    SELECT tm.agent_id, t.workspace_id
    FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.project_id = NEW.id
      AND COALESCE(t.is_active, true) = true
      AND COALESCE(t.is_deleted, false) = false
      AND COALESCE(tm.is_active, true) = true
      AND COALESCE(tm.is_deleted, false) = false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_active_components_on_plan ON public.project_plans;
CREATE TRIGGER trg_sync_active_components_on_plan
AFTER UPDATE OF mobile_components ON public.project_plans
FOR EACH ROW EXECUTE FUNCTION public.sync_active_components_from_plan();

-- 6. Backfill
UPDATE public.user_workspaces uw
SET active_components = public.compute_user_workspace_active_components(uw.user_id, uw.workspace_id);
