-- Add missing fields to notes table
ALTER TABLE public.notes 
ADD COLUMN agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_notes_agent_id ON public.notes(agent_id);
CREATE INDEX idx_notes_workspace_id ON public.notes(workspace_id);
CREATE INDEX idx_notes_note_type ON public.notes(note_type);

-- Enable RLS (if not already enabled)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes table
-- Agents can insert their own notes
CREATE POLICY "Agents can insert their own notes"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid());

-- Agents can view their own notes
CREATE POLICY "Agents can view their own notes"
ON public.notes
FOR SELECT
TO authenticated
USING (agent_id = auth.uid());

-- Agents can update their own notes
CREATE POLICY "Agents can update their own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- Agents can delete their own notes
CREATE POLICY "Agents can delete their own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (agent_id = auth.uid());

-- Supervisors can view all notes in their workspaces
CREATE POLICY "Supervisors can view all notes in their workspaces"
ON public.notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

-- Supervisors can manage all notes in their workspaces
CREATE POLICY "Supervisors can manage all notes in their workspaces"
ON public.notes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);
