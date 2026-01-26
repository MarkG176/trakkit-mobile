-- Drop existing constraints and add updated ones that include 'instore'

-- Update teams table constraint
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
ALTER TABLE teams ADD CONSTRAINT teams_team_type_check 
CHECK (team_type = ANY (ARRAY['sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'instore', 'wholesale', 'hybrid']));

-- Update user_workspaces table constraint
ALTER TABLE user_workspaces DROP CONSTRAINT IF EXISTS user_workspaces_team_type_check;
ALTER TABLE user_workspaces ADD CONSTRAINT user_workspaces_team_type_check 
CHECK (team_type = ANY (ARRAY['sales_activation', 'survey_campaign', 'brand_activation', 'door_to_door', 'sampling', 'instore', 'wholesale', 'hybrid']));