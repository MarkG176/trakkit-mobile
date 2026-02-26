-- Fix notes INSERT RLS policy to allow null workspace_id
-- The previous policy required workspace_id to be in user_workspaces with is_active = true,
-- which caused "Failed to save notes" errors when workspace_id was null (workspace not yet loaded)
-- or when user_workspaces entries had is_active = null instead of true.
DROP POLICY IF EXISTS "Agents can insert their own notes" ON public.notes;

CREATE POLICY "Agents can insert their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid()
  AND (
    workspace_id IS NULL
    OR workspace_id IN (
      SELECT workspace_id
      FROM user_workspaces
      WHERE user_id = auth.uid()
    )
  )
);
