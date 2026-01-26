-- Create stock_reports table for wholesale stock level tracking
CREATE TABLE public.stock_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  stock_level TEXT NOT NULL CHECK (stock_level IN ('available', 'low_stock', 'unavailable')),
  report_type TEXT NOT NULL CHECK (report_type IN ('morning', 'evening')),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  workspace_id UUID REFERENCES public.workspaces(id),
  store_id UUID REFERENCES public.stores(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_stock_reports_agent_date ON public.stock_reports(agent_id, reported_at DESC);
CREATE INDEX idx_stock_reports_product ON public.stock_reports(product_variant_id, reported_at DESC);
CREATE INDEX idx_stock_reports_workspace ON public.stock_reports(workspace_id, reported_at DESC);

-- Comment for documentation
COMMENT ON TABLE public.stock_reports IS 'Stores wholesale agent stock level reports submitted during check-in (morning) and check-out (evening)';