-- Add the missing category column to sale_items table
ALTER TABLE public.sale_items
ADD COLUMN IF NOT EXISTS category TEXT;

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';