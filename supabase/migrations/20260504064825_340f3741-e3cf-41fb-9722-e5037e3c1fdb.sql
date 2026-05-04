CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT workspace_id
  FROM public.user_workspaces
  WHERE user_id = auth.uid()
    AND COALESCE(is_active, true) = true
  ORDER BY created_at ASC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_workspace_id() FROM anon;