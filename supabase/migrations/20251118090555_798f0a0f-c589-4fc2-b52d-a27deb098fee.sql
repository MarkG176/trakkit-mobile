-- Add store_id column to interactions table
ALTER TABLE interactions 
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_interactions_store_id ON interactions(store_id);