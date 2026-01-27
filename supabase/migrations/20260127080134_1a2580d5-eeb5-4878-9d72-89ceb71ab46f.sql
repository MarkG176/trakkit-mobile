-- Create daily_stock_reports table for tracking stock levels during check-in/check-out
CREATE TABLE public.daily_stock_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  stock_level TEXT NOT NULL CHECK (stock_level IN ('available', 'low_stock', 'unavailable')),
  report_type TEXT NOT NULL CHECK (report_type IN ('morning', 'evening')),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workspace_id UUID REFERENCES public.workspaces(id),
  store_id UUID REFERENCES public.stores(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_daily_stock_reports_agent_date ON public.daily_stock_reports(agent_id, work_date);
CREATE INDEX idx_daily_stock_reports_workspace ON public.daily_stock_reports(workspace_id);
CREATE INDEX idx_daily_stock_reports_product ON public.daily_stock_reports(product_variant_id);

-- Enable RLS
ALTER TABLE public.daily_stock_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can insert their own stock reports" 
ON public.daily_stock_reports 
FOR INSERT 
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can view their own stock reports" 
ON public.daily_stock_reports 
FOR SELECT 
USING (agent_id = auth.uid());

CREATE POLICY "Supervisors can view all stock reports" 
ON public.daily_stock_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'supervisor'::app_role
));