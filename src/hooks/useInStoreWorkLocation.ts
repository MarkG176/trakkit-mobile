import { useMemo } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { isInStoreWorkLocation } from '@/services/workspaceService';

/**
 * Reactive in-store flag from `user_workspaces.active_components` for the current workspace.
 * Use this in UI that must update when workspace data loads or the user switches workspace.
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
