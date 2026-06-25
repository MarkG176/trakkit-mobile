import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";

export type CheckInRange = "today" | "all";

export interface CheckInRecord {
  id: string;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  selfie_url: string | null;
  in_range: boolean | null;
  distance_from_assigned: number | null;
  store_id: string | null;
  store_name: string | null;
}

/**
 * Fetches the current agent's own check-in records (status = 'checked_in'),
 * mirroring the filters used by useAgentProfileStats so the list matches the
 * count shown on the Profile page. Cached via React Query.
 */
export const useAgentCheckIns = (range: CheckInRange | null) => {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const agentId = user?.id;

  return useQuery({
    queryKey: ["agent-checkins", agentId, currentWorkspaceId, range],
    enabled: Boolean(range && agentId && currentWorkspaceId),
    queryFn: async (): Promise<CheckInRecord[]> => {
      let query = supabase
        .from("agent_status_log")
        .select(
          "id, status, timestamp, location_lat, location_lng, selfie_url, in_range, distance_from_assigned, store_id, stores:store_id(store_name)",
        )
        .eq("agent_id", agentId!)
        .eq("workspace_id", currentWorkspaceId!)
        .eq("status", "checked_in")
        .order("timestamp", { ascending: false });

      if (range === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        query = query.gte("timestamp", start.toISOString());
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        status: row.status,
        timestamp: row.timestamp,
        location_lat: row.location_lat,
        location_lng: row.location_lng,
        selfie_url: row.selfie_url,
        in_range: row.in_range,
        distance_from_assigned: row.distance_from_assigned,
        store_id: row.store_id,
        store_name: row.stores?.store_name ?? null,
      }));
    },
  });
};
