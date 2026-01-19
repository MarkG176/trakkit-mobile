-- Add mark@darajaplus.com to workspace A
INSERT INTO user_workspaces (user_id, workspace_id, role, is_active, name, email) 
VALUES (
  '7a247be3-d97e-4d51-bdcc-b30a7433e41f', 
  'c3e06d11-7148-42e3-b798-eddabf805fab', 
  'member', 
  true, 
  'Mark', 
  'mark@darajaplus.com'
) 
ON CONFLICT (user_id, workspace_id) DO NOTHING;