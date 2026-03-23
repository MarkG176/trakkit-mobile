ALTER TABLE public.store_price_reports ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.store_price_reports ADD COLUMN IF NOT EXISTS measurement text;