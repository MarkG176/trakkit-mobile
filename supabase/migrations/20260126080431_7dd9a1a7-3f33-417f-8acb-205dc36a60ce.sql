-- Add team_type column to teams table matching project_type values
ALTER TABLE public.teams 
ADD COLUMN team_type text DEFAULT 'hybrid';

-- Add a check constraint to ensure valid team_type values
ALTER TABLE public.teams 
ADD CONSTRAINT teams_team_type_check 
CHECK (team_type IN ('sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'wholesale', 'hybrid'));

-- Add comment for documentation
COMMENT ON COLUMN public.teams.team_type IS 'Type of team that determines feature availability. Matches project_type values.';