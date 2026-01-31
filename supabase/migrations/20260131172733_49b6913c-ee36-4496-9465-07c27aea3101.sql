-- Drop the old check constraint that doesn't allow NULL
ALTER TABLE public.daily_stock_reports 
  DROP CONSTRAINT IF EXISTS daily_stock_reports_stock_level_check;

-- Add the updated check constraint that allows NULL for evening reports
ALTER TABLE public.daily_stock_reports 
  ADD CONSTRAINT daily_stock_reports_stock_level_check 
  CHECK (stock_level IS NULL OR stock_level IN ('available', 'low_stock', 'unavailable'));