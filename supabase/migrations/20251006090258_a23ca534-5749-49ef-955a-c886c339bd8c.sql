-- Create giveaways table
CREATE TABLE public.giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  workspace_id UUID,
  
  -- Products given
  products_given JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INTEGER NOT NULL DEFAULT 0,
  
  -- Recipient information
  recipient_name TEXT,
  recipient_phone TEXT,
  notes TEXT,
  
  -- Engagement details
  engagement_quality TEXT,
  engagement_duration INTEGER,
  customer_interest_level TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  
  -- Location data
  location_lat NUMERIC,
  location_lng NUMERIC,
  
  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents to manage their own giveaways
CREATE POLICY "Agents can insert their own giveaways"
ON public.giveaways
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can view their own giveaways"
ON public.giveaways
FOR SELECT
TO authenticated
USING (agent_id = auth.uid() AND NOT is_deleted);

CREATE POLICY "Agents can update their own giveaways"
ON public.giveaways
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid())
WITH CHECK (agent_id = auth.uid());

-- RLS Policy for supervisors to view all giveaways
CREATE POLICY "Supervisors can view all giveaways"
ON public.giveaways
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
  AND NOT is_deleted
);

-- Create index for performance
CREATE INDEX idx_giveaways_agent_id ON public.giveaways(agent_id);
CREATE INDEX idx_giveaways_workspace_id ON public.giveaways(workspace_id);
CREATE INDEX idx_giveaways_recorded_at ON public.giveaways(recorded_at);

-- Add trigger for updated_at
CREATE TRIGGER update_giveaways_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();