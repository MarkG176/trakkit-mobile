-- Fix the notes table RLS policy to avoid circular dependency
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Agents can insert their own notes" ON public.notes;

-- Create new policy that checks workspace membership directly without function call
CREATE POLICY "Agents can insert their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid() 
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);