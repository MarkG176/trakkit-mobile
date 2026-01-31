-- Create stock_report_templates table for storing question templates
CREATE TABLE public.stock_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add template_id and responses columns to existing stock_reports table
ALTER TABLE public.stock_reports 
  ADD COLUMN template_id UUID REFERENCES public.stock_report_templates(id) ON DELETE SET NULL,
  ADD COLUMN responses JSONB DEFAULT '[]'::jsonb;

-- Create indexes
CREATE INDEX idx_stock_report_templates_workspace ON public.stock_report_templates(workspace_id);
CREATE INDEX idx_stock_report_templates_active ON public.stock_report_templates(is_active);
CREATE INDEX idx_stock_reports_template ON public.stock_reports(template_id);

-- Add trigger for updated_at on templates
CREATE TRIGGER update_stock_report_templates_updated_at
  BEFORE UPDATE ON public.stock_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();