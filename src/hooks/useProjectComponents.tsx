import { useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { workspaceService } from "@/services/workspaceService";

export interface ProjectComponentFlags {
  enable_record_sale: boolean;
  enable_give_products: boolean;
  enable_take_surveys: boolean;
  enable_log_interaction: boolean;
  enable_stock_reports: boolean;
  enable_inventory: boolean;
  enable_routes: boolean;
  enable_reports: boolean;
  enable_activity: boolean;
  enable_manage_agents: boolean;
  enable_closing_report: boolean;
}

const DEFAULT_FLAGS: ProjectComponentFlags = {
  enable_record_sale: true,
  enable_give_products: true,
  enable_take_surveys: true,
  enable_log_interaction: true,
  enable_stock_reports: true,
  enable_inventory: true,
  enable_routes: true,
  enable_reports: true,
  enable_activity: true,
  enable_manage_agents: true,
  enable_closing_report: false,
};

const mergeFlags = (raw: Record<string, boolean> | null | undefined): ProjectComponentFlags => {
  if (!raw) return DEFAULT_FLAGS;
  return {
    enable_record_sale: raw.enable_record_sale ?? DEFAULT_FLAGS.enable_record_sale,
    enable_give_products: raw.enable_give_products ?? DEFAULT_FLAGS.enable_give_products,
    enable_take_surveys: raw.enable_take_surveys ?? DEFAULT_FLAGS.enable_take_surveys,
    enable_log_interaction: raw.enable_log_interaction ?? DEFAULT_FLAGS.enable_log_interaction,
    enable_stock_reports: raw.enable_stock_reports ?? DEFAULT_FLAGS.enable_stock_reports,
    enable_inventory: raw.enable_inventory ?? DEFAULT_FLAGS.enable_inventory,
    enable_routes: raw.enable_routes ?? DEFAULT_FLAGS.enable_routes,
    enable_reports: raw.enable_reports ?? DEFAULT_FLAGS.enable_reports,
    enable_activity: raw.enable_activity ?? DEFAULT_FLAGS.enable_activity,
    enable_manage_agents: raw.enable_manage_agents ?? DEFAULT_FLAGS.enable_manage_agents,
    enable_closing_report: raw.enable_closing_report ?? DEFAULT_FLAGS.enable_closing_report,
  };
};

/**
 * Reads per-project component flags from the cached `user_workspaces.active_components`
 * field, which is hydrated once at sign-in by `workspaceService.loadUserWorkspaces()`
 * and kept in sync by Postgres triggers on `team_members`, `teams`, and
 * `project_plans.mobile_components`.
 *
 * `currentProjectId` is accepted for backwards compatibility but no longer triggers
 * a network request — flags resolve synchronously from the workspace context.
 */
export const useProjectComponents = (_currentProjectId?: string | null) => {
  const { userWorkspaces, currentWorkspaceId, isInitialized } = useWorkspace();

  const flags = useMemo(() => {
    const raw =
      userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components ??
      workspaceService.getCurrentActiveComponents();
    return mergeFlags(raw);
  }, [userWorkspaces, currentWorkspaceId]);

  return {
    flags,
    isLoading: !isInitialized,
    isLoaded: isInitialized,
  };
};
