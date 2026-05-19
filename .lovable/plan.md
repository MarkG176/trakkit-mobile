## Goal
Make `/reports` render a visible loading, redirected, or Reports screen instead of a blank white page.

## What I found
- `/reports` is wrapped in `ProjectComponentGate code="CRM-0099"`.
- `ProjectComponentGate` currently returns `null` while `useWorkspace().isInitialized` or `useProjectComponents().isLoaded` is false, which creates a blank white screen.
- Workspace initialization is async inside `workspaceService.initialize(...)`, but `WorkspaceProvider` only syncs state if the service is already initialized when the auth user changes, then relies on a 1s polling loop. If initialization is slow or silently fails, guarded pages can stay blank.
- `useProjectComponents.isLoaded` is just `isInitialized`, so the route guard has no fallback UI or timeout/error state.

## Fix plan
1. **Fix the route guard blank state**
   - Update `ProjectComponentGate` to show a branded loading screen/spinner while workspace/component flags are loading instead of returning `null`.
   - If the component is disabled after loading, keep redirecting to `/`.

2. **Make workspace initialization reactive**
   - Update `WorkspaceProvider` so when a user exists and `workspaceService` is not initialized yet, it calls/awaits `workspaceService.initialize(user)` itself and then syncs React state.
   - Keep the existing refresh/switch behavior intact.
   - Add safe error handling so initialization failures don’t leave the UI permanently blank.

3. **Harden Reports page currentPage/back route mismatch**
   - Set `MobileLayout currentPage="reports"` in `Reports.tsx` so the bottom navigation state matches the page.
   - Change the back button from `/more` to `/` or remove dependence on a disabled More route, preventing navigation to an unavailable page.

4. **Validate**
   - Re-open `/reports` in the preview.
   - Confirm it no longer shows a blank white screen: it should either render Reports, show the loader while initializing, or redirect if `CRM-0099` is disabled.