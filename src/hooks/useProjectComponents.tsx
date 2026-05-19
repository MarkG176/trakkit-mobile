import { useMemo, useCallback } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { workspaceService } from "@/services/workspaceService";
import { mergeWithDefaults, DEFAULT_MOBILE_COMPONENTS } from "@/data/mobileComponentsCatalog";

/**
 * Reads per-project component flags from the cached `user_workspaces.active_components`
 * field, which is hydrated once at sign-in by `workspaceService.loadUserWorkspaces()`
 * and kept in sync by Postgres triggers on `team_members`, `teams`, and
 * `project_plans.mobile_components`.
 *
 * Each flag is keyed by a stable CRM-XXXX code from `mobileComponentsCatalog`.
 * Missing keys default to `true`, so a brand-new workspace with no overrides
 * sees every component enabled.
 *
 * `currentProjectId` is accepted for backwards compatibility but no longer triggers
 * a network request — flags resolve synchronously from the workspace context.
 */
export const useProjectComponents = (_currentProjectId?: string | null) => {
  const { userWorkspaces, currentWorkspaceId, isInitialized } = useWorkspace();

  const codes = useMemo(() => {
    const raw =
      userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components ??
      workspaceService.getCurrentActiveComponents();
    return mergeWithDefaults(raw);
  }, [userWorkspaces, currentWorkspaceId]);

  const isEnabled = useCallback(
    (code: string): boolean => codes[code] ?? DEFAULT_MOBILE_COMPONENTS[code] ?? true,
    [codes],
  );

  return {
    codes,
    isEnabled,
    isLoading: !isInitialized,
    isLoaded: isInitialized,
  };
};
