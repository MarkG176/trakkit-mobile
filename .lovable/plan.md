

## Fix: Invited Users Should Default to Their Invited Workspace

### Problem
When a new user is invited via the Supervisor Users page, a database trigger (`on_auth_user_created_add_to_workspace`) automatically adds them to a "Default Workspace" first. Then the `create-user` edge function adds them to the correct invited workspace. On first login, `workspaceService` sorts by `created_at ASC` and picks the first entry -- which is always the Default Workspace because it was created milliseconds earlier by the trigger.

### Changes

**1. `supabase/functions/create-user/index.ts`**
- After creating the `user_workspaces` entry for the invited workspace, delete any "Default Workspace" entry for that user (so there's no competing record)
- Look up the default workspace by name ("Default Workspace") and remove the user from it, but only if the invited workspace is different from the default

**2. `src/services/workspaceService.ts`**
- Change the sort order from `created_at ASC` to `created_at DESC` on line 127
- This ensures that if multiple workspace entries exist, the most recently assigned one (the invited workspace) is selected as the default on first login

### Technical Details

In `create-user/index.ts`, after the existing `user_workspaces` upsert (around line 85), add:

```text
// Remove user from Default Workspace if they were invited to a different one
const { data: defaultWs } = await supabaseAdmin
  .from('workspaces')
  .select('id')
  .eq('name', 'Default Workspace')
  .single();

if (defaultWs && defaultWs.id !== workspaceId) {
  await supabaseAdmin
    .from('user_workspaces')
    .delete()
    .eq('user_id', userId)
    .eq('workspace_id', defaultWs.id);
}
```

In `workspaceService.ts`, line 127:
- Change `.order('created_at', { ascending: true })` to `.order('created_at', { ascending: false })`

