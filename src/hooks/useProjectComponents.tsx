import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

/**
 * Loads per-project component toggles from `project_components`.
 * If no row exists for the project, all components are enabled by default.
 */
export const useProjectComponents = (currentProjectId: string | null) => {
  const [flags, setFlags] = useState<ProjectComponentFlags>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!currentProjectId) {
      setFlags(DEFAULT_FLAGS);
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsLoaded(false);

    (async () => {
      const { data, error } = await supabase
        .from("project_components")
        .select(
          "enable_record_sale, enable_give_products, enable_take_surveys, enable_log_interaction, enable_stock_reports, enable_inventory, enable_routes, enable_reports, enable_activity, enable_manage_agents, enable_closing_report"
        )
        .eq("project_id", currentProjectId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[useProjectComponents] load error", error);
        setFlags(DEFAULT_FLAGS);
      } else if (data) {
        setFlags({
          enable_record_sale: data.enable_record_sale ?? true,
          enable_give_products: data.enable_give_products ?? true,
          enable_take_surveys: data.enable_take_surveys ?? true,
          enable_log_interaction: data.enable_log_interaction ?? true,
          enable_stock_reports: data.enable_stock_reports ?? true,
          enable_inventory: data.enable_inventory ?? true,
          enable_routes: data.enable_routes ?? true,
          enable_reports: data.enable_reports ?? true,
          enable_activity: data.enable_activity ?? true,
          enable_manage_agents: data.enable_manage_agents ?? true,
          enable_closing_report: (data as any).enable_closing_report ?? false,
        });
      } else {
        setFlags(DEFAULT_FLAGS);
      }

      setIsLoading(false);
      setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProjectId]);

  return { flags, isLoading, isLoaded };
};
