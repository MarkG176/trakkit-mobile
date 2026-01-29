-- Create a function to sync team_type from project_plans to teams
CREATE OR REPLACE FUNCTION public.sync_team_type_from_project()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When project_plans.project_type changes, update related teams
  UPDATE teams t
  SET team_type = NEW.project_type
  FROM day_plans dp
  WHERE dp.project_id = NEW.id
    AND dp.team_id = t.id
    AND (t.team_type IS DISTINCT FROM NEW.project_type);
  
  RETURN NEW;
END;
$$;

-- Create trigger on project_plans
DROP TRIGGER IF EXISTS sync_team_type_on_project_update ON project_plans;
CREATE TRIGGER sync_team_type_on_project_update
  AFTER UPDATE OF project_type ON project_plans
  FOR EACH ROW
  WHEN (OLD.project_type IS DISTINCT FROM NEW.project_type)
  EXECUTE FUNCTION sync_team_type_from_project();

-- Create a function to sync team_type from teams to user_workspaces
CREATE OR REPLACE FUNCTION public.sync_user_workspace_team_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When teams.team_type changes, update team members' user_workspaces
  UPDATE user_workspaces uw
  SET team_type = NEW.team_type
  FROM team_members tm
  WHERE tm.team_id = NEW.id
    AND tm.agent_id = uw.user_id
    AND uw.workspace_id = NEW.workspace_id
    AND (uw.team_type IS DISTINCT FROM NEW.team_type);
  
  RETURN NEW;
END;
$$;

-- Create trigger on teams
DROP TRIGGER IF EXISTS sync_user_workspace_on_team_update ON teams;
CREATE TRIGGER sync_user_workspace_on_team_update
  AFTER UPDATE OF team_type ON teams
  FOR EACH ROW
  WHEN (OLD.team_type IS DISTINCT FROM NEW.team_type)
  EXECUTE FUNCTION sync_user_workspace_team_type();

-- Also sync when a team member is added
CREATE OR REPLACE FUNCTION public.sync_user_workspace_on_team_join()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_team_type TEXT;
  v_workspace_id UUID;
BEGIN
  -- Get the team's type and workspace_id
  SELECT team_type, workspace_id INTO v_team_type, v_workspace_id
  FROM teams
  WHERE id = NEW.team_id;
  
  -- Update the user's workspace team_type
  UPDATE user_workspaces
  SET team_type = v_team_type
  WHERE user_id = NEW.agent_id
    AND workspace_id = v_workspace_id
    AND (team_type IS DISTINCT FROM v_team_type);
  
  RETURN NEW;
END;
$$;

-- Create trigger on team_members
DROP TRIGGER IF EXISTS sync_user_workspace_on_member_insert ON team_members;
CREATE TRIGGER sync_user_workspace_on_member_insert
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_workspace_on_team_join();