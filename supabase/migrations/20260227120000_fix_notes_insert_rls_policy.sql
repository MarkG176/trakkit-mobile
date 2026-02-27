-- Fix notes INSERT RLS policy to handle NULL is_active in user_workspaces
-- Root cause: the notes INSERT policy uses `is_active = true`, but NULL = true
-- evaluates to NULL (not TRUE) in SQL, blocking inserts for users whose
-- user_workspaces.is_active was never explicitly set to true.

-- Ensure is_active column exists on user_workspaces with a default of true
ALTER TABLE public.user_workspaces
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set is_active = true for any existing rows that have is_active IS NULL
UPDATE public.user_workspaces
SET is_active = true
WHERE is_active IS NULL;

-- Drop the overly-strict INSERT policy introduced in 20251015105732
DROP POLICY IF EXISTS "Agents can insert their own notes" ON public.notes;

-- Re-create the INSERT policy using COALESCE so NULL is_active is treated as active
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
    AND COALESCE(is_active, true) = true
  )
);
