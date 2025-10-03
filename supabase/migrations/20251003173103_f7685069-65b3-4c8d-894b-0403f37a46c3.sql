-- Create stores table
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL,
  county TEXT NOT NULL,
  store_lat NUMERIC(10, 7) NOT NULL,
  store_long NUMERIC(10, 7) NOT NULL,
  products JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for location queries
CREATE INDEX idx_stores_location ON public.stores(store_lat, store_long);

-- Add index for products JSONB field
CREATE INDEX idx_stores_products ON public.stores USING GIN(products);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Agents can view all stores"
ON public.stores
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Supervisors can manage stores"
ON public.stores
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'supervisor'::app_role
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_stores_updated_at
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add constraint to validate products array contains valid product_variant_ids
CREATE OR REPLACE FUNCTION validate_store_products()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all product IDs in the array exist in product_variants
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(NEW.products) AS product_id
    WHERE NOT EXISTS (
      SELECT 1 FROM product_variants
      WHERE id = product_id::uuid
    )
  ) THEN
    RAISE EXCEPTION 'All products must reference valid product_variant IDs';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_products_trigger
BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW
EXECUTE FUNCTION validate_store_products();