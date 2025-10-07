-- Create customers table to track customer history
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  county TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(phone) -- Prevent duplicate phone numbers
);

-- Create customer_purchases table to track purchase history
CREATE TABLE public.customer_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  store_id UUID REFERENCES public.stores(id),
  product_variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_value NUMERIC NOT NULL DEFAULT 0,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  location_lat NUMERIC,
  location_lng NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers table
CREATE POLICY "Agents can view all customers"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('agent'::app_role, 'supervisor'::app_role)
  )
);

CREATE POLICY "Agents can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('agent'::app_role, 'supervisor'::app_role)
  )
);

CREATE POLICY "Agents can update customers"
ON public.customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('agent'::app_role, 'supervisor'::app_role)
  )
);

-- RLS Policies for customer_purchases table
CREATE POLICY "Agents can view their own customer purchases"
ON public.customer_purchases
FOR SELECT
USING (
  agent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
);

CREATE POLICY "Agents can insert their own customer purchases"
ON public.customer_purchases
FOR INSERT
WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Supervisors can view all customer purchases"
ON public.customer_purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'supervisor'::app_role
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customer_purchases_customer_id ON public.customer_purchases(customer_id);
CREATE INDEX idx_customer_purchases_agent_id ON public.customer_purchases(agent_id);
CREATE INDEX idx_customer_purchases_purchase_date ON public.customer_purchases(purchase_date);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();