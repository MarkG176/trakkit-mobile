-- Create a SECURITY DEFINER helper function to check workspace membership.
-- Using SECURITY DEFINER bypasses RLS on user_workspaces, which prevents the
-- recursive policy evaluation that occurred when the notes INSERT policy ran a
-- subquery against user_workspaces (the "Workspace admins can manage memberships"
-- FOR ALL policy on user_workspaces queries user_workspaces itself, causing RLS
-- recursion that silently blocked the subquery from returning rows).
-- The function also treats NULL is_active as active to support legacy records
-- that existed before the is_active column was added to user_workspaces.
CREATE OR REPLACE FUNCTION public.user_is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM user_workspaces
    WHERE user_id    = auth.uid()
      AND workspace_id = p_workspace_id
      AND (is_active IS NULL OR is_active = true)
  );
$$;

-- Fix the notes INSERT policy to use the SECURITY DEFINER function above.
-- The previous policy used a bare subquery against user_workspaces which
-- triggered recursive RLS evaluation and also required is_active = true
-- (breaking inserts for users whose membership has is_active = NULL).
DROP POLICY IF EXISTS "Agents can insert their own notes" ON public.notes;

CREATE POLICY "Agents can insert their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid()
  AND (workspace_id IS NULL OR user_is_workspace_member(workspace_id))
);
