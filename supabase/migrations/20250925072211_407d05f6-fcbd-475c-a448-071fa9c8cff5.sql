-- Create reports table for storing agent performance reports
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'personal',
  period TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metrics JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Agents can view their own reports
CREATE POLICY "Agents can view their own reports"
ON public.reports
FOR SELECT
USING (agent_id = auth.uid());

-- Agents can create their own reports
CREATE POLICY "Agents can create their own reports"
ON public.reports
FOR INSERT
WITH CHECK (agent_id = auth.uid());

-- Supervisors can view all reports
CREATE POLICY "Supervisors can view all reports"
ON public.reports
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid()
  AND role = 'supervisor'
));

-- Add trigger for updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();