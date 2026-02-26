-- Add is_active column to team_members table
-- This column is referenced in RLS policies and was missing, causing
-- "column tm.is_active does not exist" errors on stores INSERT.
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
