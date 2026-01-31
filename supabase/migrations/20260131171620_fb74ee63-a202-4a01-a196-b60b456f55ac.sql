-- Make stock_level nullable for evening reports
ALTER TABLE public.daily_stock_reports 
  ALTER COLUMN stock_level DROP NOT NULL;

-- Add quantity_sold column for evening reports
ALTER TABLE public.daily_stock_reports 
  ADD COLUMN quantity_sold INTEGER DEFAULT NULL;

-- Update check constraint to allow NULL stock_level
ALTER TABLE public.daily_stock_reports 
  DROP CONSTRAINT IF EXISTS daily_stock_reports_stock_level_check;

ALTER TABLE public.daily_stock_reports 
  ADD CONSTRAINT daily_stock_reports_stock_level_check 
  CHECK (stock_level IS NULL OR stock_level IN ('available', 'low_stock', 'unavailable'));