-- Create agent_status_log table
CREATE TABLE public.agent_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('checked_out', 'checked_in', 'lunch')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  location_lat NUMERIC,
  location_lng NUMERIC,
  assigned_location_lat NUMERIC,
  assigned_location_lng NUMERIC,
  distance_from_assigned NUMERIC,
  selfie_url TEXT,
  check_in_successful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_status_log ENABLE ROW LEVEL SECURITY;

-- Agents can insert their own status logs
CREATE POLICY "Agents can insert their own status logs"
ON public.agent_status_log
FOR INSERT
WITH CHECK (agent_id = auth.uid());

-- Agents can view their own status logs
CREATE POLICY "Agents can view their own status logs"
ON public.agent_status_log
FOR SELECT
USING (agent_id = auth.uid());

-- Supervisors can view all status logs
CREATE POLICY "Supervisors can view all status logs"
ON public.agent_status_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'
  )
);