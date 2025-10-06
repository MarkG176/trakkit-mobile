-- Add workspace_id to survey_templates table
ALTER TABLE public.survey_templates 
ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Update existing survey templates to belong to Capwell workspace
UPDATE public.survey_templates 
SET workspace_id = 'capwell-workspace-id'::uuid 
WHERE workspace_id IS NULL;

-- Make workspace_id NOT NULL after updating existing records
ALTER TABLE public.survey_templates 
ALTER COLUMN workspace_id SET NOT NULL;

-- Create index for performance
CREATE INDEX idx_survey_templates_workspace_id ON public.survey_templates(workspace_id);

-- Update RLS policies for survey_templates
DROP POLICY IF EXISTS "Agents can view all survey templates" ON public.survey_templates;
DROP POLICY IF EXISTS "Supervisors can manage survey templates" ON public.survey_templates;

CREATE POLICY "Agents can view survey templates in their workspaces"
ON public.survey_templates
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can manage survey templates in their workspaces"
ON public.survey_templates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
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
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
  AND workspace_id IN (
    SELECT workspace_id 
    FROM user_workspaces 
    WHERE user_id = auth.uid()
  )
);
