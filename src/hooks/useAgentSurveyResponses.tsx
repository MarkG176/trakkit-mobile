import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

export type SurveyResponseRange = "today" | "all";

export interface SurveyResponseRecord {
  id: string;
  survey_template_id: string | null;
  completed_at: string | null;
  created_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  responses: Record<string, unknown> | null;
  template_title: string | null;
}

/**
 * Fetches the current agent's completed survey responses, mirroring the
 * filters used by useAgentProfileStats so the list matches the Profile count.
 * Cached via React Query.
 */
export const useAgentSurveyResponses = (range: SurveyResponseRange = "all") => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const agentId = user?.id;

  return useQuery({
    queryKey: ["agent-survey-responses", agentId, currentWorkspaceId, range],
    enabled: Boolean(agentId && currentWorkspaceId),
    queryFn: async (): Promise<SurveyResponseRecord[]> => {
      let query = supabase
        .from("survey_responses")
        .select(
          "id, survey_template_id, completed_at, created_at, location_lat, location_lng, responses, survey_templates:survey_template_id(title)",
        )
        .eq("agent_id", agentId!)
        .eq("workspace_id", currentWorkspaceId!)
        .eq("is_completed", true)
        .not("is_deleted", "is", true)
        .order("completed_at", { ascending: false });

      if (range === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const startIso = start.toISOString();
        // Match the Profile count filter: completed_at within today, or
        // (completed_at null and created_at within today).
        query = query.or(
          `completed_at.gte.${startIso},and(completed_at.is.null,created_at.gte.${startIso})`,
        );
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        survey_template_id: row.survey_template_id,
        completed_at: row.completed_at,
        created_at: row.created_at,
        location_lat: row.location_lat,
        location_lng: row.location_lng,
        responses: row.responses ?? null,
        template_title: row.survey_templates?.title ?? null,
      }));
    },
  });
};
