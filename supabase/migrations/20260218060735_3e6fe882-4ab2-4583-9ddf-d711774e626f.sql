
-- Add 'seeding' to teams.team_type check constraint
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
ALTER TABLE public.teams ADD CONSTRAINT teams_team_type_check CHECK (team_type IN ('sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'instore', 'wholesale', 'hybrid', 'seeding'));

-- Add 'seeding' to user_workspaces.team_type check constraint
ALTER TABLE public.user_workspaces DROP CONSTRAINT IF EXISTS user_workspaces_team_type_check;
ALTER TABLE public.user_workspaces ADD CONSTRAINT user_workspaces_team_type_check CHECK (team_type IN ('sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'instore', 'wholesale', 'hybrid', 'seeding'));
