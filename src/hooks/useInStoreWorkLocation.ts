import { useMemo } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { isInStoreWorkLocation } from '@/services/workspaceService';

/**
 * Reactive in-store flag from the signed-in user's `user_workspaces.active_components`
 * row for the current workspace (JSON from DB). Does not infer from labels or other caches.
 */
export function useInStoreWorkLocation(): boolean {
  const { userWorkspaces, currentWorkspaceId } = useWorkspace();
  return useMemo(
    () =>
      isInStoreWorkLocation(
        userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components ??
          null,
      ),
    [userWorkspaces, currentWorkspaceId],
  );
}
