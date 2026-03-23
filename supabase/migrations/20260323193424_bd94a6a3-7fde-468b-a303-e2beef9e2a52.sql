CREATE TABLE public.store_price_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  price NUMERIC NOT NULL DEFAULT 0,
  stock_level TEXT,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workspace_id UUID REFERENCES public.workspaces(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_price_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can insert their own price reports" ON public.store_price_reports FOR INSERT WITH CHECK (agent_id = auth.uid());
CREATE POLICY "Agents can view their own price reports" ON public.store_price_reports FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Supervisors can view all price reports" ON public.store_price_reports FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'supervisor'::app_role));