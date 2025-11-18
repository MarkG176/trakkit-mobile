-- Add target_stores column to project_plans table
ALTER TABLE project_plans 
ADD COLUMN IF NOT EXISTS target_stores uuid[];

-- Add GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_project_plans_target_stores ON project_plans USING GIN(target_stores);