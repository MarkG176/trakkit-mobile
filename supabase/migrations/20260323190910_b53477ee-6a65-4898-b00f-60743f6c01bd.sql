-- Step 1: Update teams check constraint with ALL existing + new values
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_team_type_check;
ALTER TABLE teams ADD CONSTRAINT teams_team_type_check CHECK (team_type = ANY (ARRAY['sales_activation','survey_campaign','survey','brand_activation','door_to_door','sampling','instore','wholesale','seeding','hybrid','market_research']));

-- Step 2: Update user_workspaces check constraint
ALTER TABLE user_workspaces DROP CONSTRAINT IF EXISTS user_workspaces_team_type_check;
ALTER TABLE user_workspaces ADD CONSTRAINT user_workspaces_team_type_check CHECK (team_type = ANY (ARRAY['sales_activation','survey_campaign','survey','brand_activation','door_to_door','sampling','instore','wholesale','seeding','hybrid','market_research']));

-- Step 3: Update project_plans check constraint
ALTER TABLE project_plans DROP CONSTRAINT IF EXISTS project_plans_project_type_check;
ALTER TABLE project_plans ADD CONSTRAINT project_plans_project_type_check CHECK (project_type = ANY (ARRAY['market_research','wholesale','survey','merchandising','instore','door_to_door','seeding','hybrid','sampling']));

-- Step 4: Update the Pepsi Research project
UPDATE project_plans SET project_type = 'market_research' WHERE id = 'dfcd0fa7-04d8-4196-9b0a-2a6baed776d0';