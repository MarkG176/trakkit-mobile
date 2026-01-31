-- Add custom_price column to product_variants for wholesale pricing
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS custom_price numeric DEFAULT 0;