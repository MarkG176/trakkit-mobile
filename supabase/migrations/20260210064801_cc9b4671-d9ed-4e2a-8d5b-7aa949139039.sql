-- Add project_id column to customer_purchases
ALTER TABLE public.customer_purchases
ADD COLUMN project_id uuid REFERENCES public.project_plans(id);

-- Create index for performance
CREATE INDEX idx_customer_purchases_project_id ON public.customer_purchases(project_id);