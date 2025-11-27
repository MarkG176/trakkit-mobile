-- Add start_date, end_date, and is_deleted fields to project_plans table
ALTER TABLE project_plans 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add index for better query performance on is_deleted
CREATE INDEX IF NOT EXISTS idx_project_plans_is_deleted ON project_plans(is_deleted) WHERE is_deleted = false;

-- Add check constraint to ensure end_date is after start_date
ALTER TABLE project_plans 
ADD CONSTRAINT check_project_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);