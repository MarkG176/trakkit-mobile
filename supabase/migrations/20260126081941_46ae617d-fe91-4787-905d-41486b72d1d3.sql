-- Add team_type column to user_workspaces table matching teams.team_type values
ALTER TABLE public.user_workspaces 
ADD COLUMN team_type text DEFAULT 'hybrid';

-- Add a check constraint to ensure valid team_type values
ALTER TABLE public.user_workspaces 
ADD CONSTRAINT user_workspaces_team_type_check 
CHECK (team_type IN ('sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'wholesale', 'hybrid'));

-- Add comment for documentation
COMMENT ON COLUMN public.user_workspaces.team_type IS 'Type of team that determines feature availability for this user in this workspace. Should match teams.team_type values.';