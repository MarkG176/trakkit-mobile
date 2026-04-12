import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface AgentActivity {
  id: string;
  agent_id: string;
  agent_display_name: string | null;
  status: string;
  timestamp: string;
  location_lat: number | null;
  location_lng: number | null;
  selfie_url: string | null;
  store_id: string | null;
  check_in_successful: boolean | null;
  distance_from_assigned: number | null;
  in_range: boolean | null;
  team_id: string | null;
  store_name?: string | null;
}

const PAGE_SIZE = 50;

/**
 * Pre-resolve agent_ids matching a search query across user_workspaces (email) and stores (outlet name).
 * Returns null if no search, or a Set of matching agent_ids + store_ids.
 */
const resolveSearchIds = async (
  workspaceId: string,
  searchQuery: string
): Promise<{ agentIds: string[]; storeIds: string[] } | null> => {
  if (!searchQuery.trim()) return null;
  const q = searchQuery.trim();

  // Search emails in user_workspaces
  const { data: emailMatches } = await supabase
    .from("user_workspaces")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .ilike("email", `%${q}%`);

  // Search store names
  const { data: storeMatches } = await supabase
    .from("stores")
    .select("id")
    .eq("workspace_id", workspaceId)
    .ilike("store_name", `%${q}%`);

  return {
    agentIds: (emailMatches || []).map((e) => e.user_id),
    storeIds: (storeMatches || []).map((s) => s.id),
  };
};

export const useAgentActivities = (
  workspaceId: string | null,
  page: number,
  filterDate: string | null,
  searchQuery: string = "",
  teamId: string | null = null
) => {
  return useQuery({
    queryKey: ["agent-activities", workspaceId, page, filterDate, searchQuery, teamId],
    queryFn: async () => {
      if (!workspaceId || !filterDate) return { data: [], count: 0 };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Resolve search across email & outlet if needed
      let searchIds: { agentIds: string[]; storeIds: string[] } | null = null;
      if (searchQuery.trim()) {
        searchIds = await resolveSearchIds(workspaceId, searchQuery);
      }

      let query = supabase
        .from("agent_status_log")
        .select("*, stores:store_id(store_name)", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .gte("timestamp", `${filterDate}T00:00:00`)
        .lt("timestamp", `${filterDate}T23:59:59.999`)
        .order("timestamp", { ascending: false })
        .range(from, to);

      // Team filter
      if (teamId) {
        query = query.eq("team_id", teamId);
      }

      // Search: name OR email-matched agents OR outlet-matched stores
      if (searchQuery.trim()) {
        const orFilters: string[] = [`agent_display_name.ilike.%${searchQuery.trim()}%`];
        if (searchIds?.agentIds && searchIds.agentIds.length > 0) {
          orFilters.push(`agent_id.in.(${searchIds.agentIds.join(",")})`);
        }
        if (searchIds?.storeIds && searchIds.storeIds.length > 0) {
          orFilters.push(`store_id.in.(${searchIds.storeIds.join(",")})`);
        }
        query = query.or(orFilters.join(","));
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Flatten store name from join
      const activities: AgentActivity[] = (data || []).map((row: any) => ({
        id: row.id,
        agent_id: row.agent_id,
        agent_display_name: row.agent_display_name,
        status: row.status,
        timestamp: row.timestamp,
        location_lat: row.location_lat,
        location_lng: row.location_lng,
        selfie_url: row.selfie_url,
        store_id: row.store_id,
        check_in_successful: row.check_in_successful,
        distance_from_assigned: row.distance_from_assigned,
        in_range: row.in_range,
        team_id: row.team_id,
        store_name: row.stores?.store_name || null,
      }));

      return { data: activities, count: count || 0 };
    },
    enabled: !!workspaceId && !!filterDate,
  });
};

export const useGalleryImages = (
  workspaceId: string | null,
  filterDate: string | null
) => {
  return useQuery({
    queryKey: ["gallery-images", workspaceId, filterDate],
    queryFn: async () => {
      if (!workspaceId || !filterDate) return [];

      const { data, error } = await supabase
        .from("agent_status_log")
        .select("id, agent_display_name, selfie_url, timestamp, status")
        .eq("workspace_id", workspaceId)
        .gte("timestamp", `${filterDate}T00:00:00`)
        .lt("timestamp", `${filterDate}T23:59:59.999`)
        .not("selfie_url", "is", null)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId && !!filterDate,
  });
};

export const useMostRecentActivityDate = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ["most-recent-activity-date", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("agent_status_log")
        .select("timestamp")
        .eq("workspace_id", workspaceId)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return new Date().toISOString().split("T")[0];
      return new Date(data.timestamp).toISOString().split("T")[0];
    },
    enabled: !!workspaceId,
  });
};

export const useWorkspaceTeams = (workspaceId: string | null) => {
  return useQuery({
    queryKey: ["workspace-teams", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .eq("workspace_id", workspaceId)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
  });
};
