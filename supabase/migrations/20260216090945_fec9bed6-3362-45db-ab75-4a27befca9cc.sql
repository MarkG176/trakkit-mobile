
ALTER TABLE public.customer_purchases
ADD COLUMN customer_name text;

-- Backfill existing records
UPDATE public.customer_purchases cp
SET customer_name = c.name
FROM public.customers c
WHERE cp.customer_id = c.id;
