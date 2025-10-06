-- Create user_workspaces table for workspace membership management
CREATE TABLE public.user_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;

-- Users can only see workspaces they're members of
CREATE POLICY "Users can view their workspaces"
ON public.user_workspaces
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own workspace memberships (for invitations)
CREATE POLICY "Users can insert their own workspace memberships"
ON public.user_workspaces
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Workspace admins can manage memberships
CREATE POLICY "Workspace admins can manage memberships"
ON public.user_workspaces
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_workspaces uw
    WHERE uw.user_id = auth.uid() 
    AND uw.workspace_id = user_workspaces.workspace_id
    AND uw.role = 'admin'
  )
);

-- Supervisors can view all workspace memberships
CREATE POLICY "Supervisors can view all workspace memberships"
ON public.user_workspaces
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
);

-- Create indexes for performance
CREATE INDEX idx_user_workspaces_user_id ON public.user_workspaces(user_id);
CREATE INDEX idx_user_workspaces_workspace_id ON public.user_workspaces(workspace_id);
CREATE INDEX idx_user_workspaces_role ON public.user_workspaces(role);

-- Add existing Capwell users to the workspace
-- This assumes all existing users should have access to Capwell workspace
INSERT INTO public.user_workspaces (user_id, workspace_id, role)
SELECT 
  ur.user_id,
  'capwell-workspace-id'::uuid,
  CASE 
    WHEN ur.role = 'supervisor' THEN 'admin'
    ELSE 'member'
  END
FROM user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM user_workspaces uw 
  WHERE uw.user_id = ur.user_id 
  AND uw.workspace_id = 'capwell-workspace-id'::uuid
);
