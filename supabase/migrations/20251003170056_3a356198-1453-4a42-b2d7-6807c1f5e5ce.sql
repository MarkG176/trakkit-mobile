-- Add daily sales tracking table for running totals
CREATE TABLE IF NOT EXISTS public.daily_sales_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id),
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status_event TEXT NOT NULL, -- 'lunch' or 'checkout'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, work_date, product_variant_id, status_event, recorded_at)
);

-- Enable RLS
ALTER TABLE public.daily_sales_tracking ENABLE ROW LEVEL SECURITY;

-- Agents can insert their own sales
CREATE POLICY "Agents can insert their own sales"
ON public.daily_sales_tracking
FOR INSERT
WITH CHECK (agent_id = auth.uid());

-- Agents can view their own sales
CREATE POLICY "Agents can view their own sales"
ON public.daily_sales_tracking
FOR SELECT
USING (agent_id = auth.uid());

-- Supervisors can view all sales
CREATE POLICY "Supervisors can view all sales"
ON public.daily_sales_tracking
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = auth.uid() AND role = 'supervisor'
));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_sales_agent_date 
ON public.daily_sales_tracking(agent_id, work_date);

CREATE INDEX IF NOT EXISTS idx_daily_sales_product 
ON public.daily_sales_tracking(product_variant_id);