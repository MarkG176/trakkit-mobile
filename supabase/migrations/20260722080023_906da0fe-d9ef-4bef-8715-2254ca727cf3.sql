
UPDATE public.agent_tasks t
SET workspace_id = uw.workspace_id
FROM public.user_workspaces uw
WHERE t.workspace_id IS NULL
  AND uw.user_id = t.agent_id
  AND COALESCE(uw.is_active, true) = true;

UPDATE public.agent_tasks t
SET workspace_id = pv.workspace_id
FROM public.agent_task_inventory ati
JOIN public.product_variants pv ON pv.id = ati.product_variant_id
WHERE t.workspace_id IS NULL
  AND ati.task_id = t.id
  AND pv.workspace_id IS NOT NULL;

UPDATE public.agent_status_log l
SET workspace_id = uw.workspace_id
FROM public.user_workspaces uw
WHERE l.workspace_id IS NULL
  AND uw.user_id = l.agent_id
  AND COALESCE(uw.is_active, true) = true;

CREATE OR REPLACE FUNCTION public.set_agent_status_log_workspace_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM public.user_workspaces
    WHERE user_id = NEW.agent_id AND COALESCE(is_active, true) = true
    ORDER BY created_at ASC LIMIT 1;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_agent_status_log_workspace_id ON public.agent_status_log;
CREATE TRIGGER trg_set_agent_status_log_workspace_id
  BEFORE INSERT ON public.agent_status_log
  FOR EACH ROW EXECUTE FUNCTION public.set_agent_status_log_workspace_id();

CREATE OR REPLACE FUNCTION public.set_agent_tasks_workspace_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM public.user_workspaces
    WHERE user_id = NEW.agent_id AND COALESCE(is_active, true) = true
    ORDER BY created_at ASC LIMIT 1;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_set_agent_tasks_workspace_id ON public.agent_tasks;
CREATE TRIGGER trg_set_agent_tasks_workspace_id
  BEFORE INSERT ON public.agent_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_agent_tasks_workspace_id();
