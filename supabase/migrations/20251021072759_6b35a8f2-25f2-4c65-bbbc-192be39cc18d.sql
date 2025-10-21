-- Function to add new users to default workspace
CREATE OR REPLACE FUNCTION public.add_user_to_default_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_workspace_id UUID;
BEGIN
  -- Get or create the default workspace
  SELECT id INTO default_workspace_id
  FROM workspaces
  WHERE name = 'Default Workspace'
  LIMIT 1;
  
  -- If no default workspace exists, create one
  IF default_workspace_id IS NULL THEN
    INSERT INTO workspaces (name, description)
    VALUES ('Default Workspace', 'Default workspace for all users')
    RETURNING id INTO default_workspace_id;
  END IF;
  
  -- Add the user to the default workspace with 'member' role
  INSERT INTO user_workspaces (user_id, workspace_id, role, is_active)
  VALUES (NEW.id, default_workspace_id, 'member', true)
  ON CONFLICT (user_id, workspace_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Never block user creation
    RAISE WARNING 'Error adding user to default workspace: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created_add_to_workspace ON auth.users;
CREATE TRIGGER on_auth_user_created_add_to_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.add_user_to_default_workspace();