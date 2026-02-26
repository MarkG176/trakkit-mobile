-- Add is_active column to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create trigger function: when project_plans.status changes to 'completed', deactivate linked teams
CREATE OR REPLACE FUNCTION public.deactivate_teams_on_project_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.teams
    SET is_active = false
    WHERE project_id = NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_deactivate_teams_on_project_complete ON public.project_plans;
CREATE TRIGGER trigger_deactivate_teams_on_project_complete
  AFTER UPDATE OF status ON public.project_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_teams_on_project_complete();

-- Also reactivate teams if project is changed back from completed to active
CREATE OR REPLACE FUNCTION public.reactivate_teams_on_project_reopen()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status = 'active' THEN
    UPDATE public.teams
    SET is_active = true
    WHERE project_id = NEW.id AND is_active = false AND NOT COALESCE(is_deleted, false);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_reactivate_teams_on_project_reopen ON public.project_plans;
CREATE TRIGGER trigger_reactivate_teams_on_project_reopen
  AFTER UPDATE OF status ON public.project_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.reactivate_teams_on_project_reopen();