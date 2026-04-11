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
}

const PAGE_SIZE = 50;

export const useAgentActivities = (
  workspaceId: string | null,
  page: number,
  filterDate: string | null,
  searchQuery: string = ""
) => {
  return useQuery({
    queryKey: ["agent-activities", workspaceId, page, filterDate, searchQuery],
    queryFn: async () => {
      if (!workspaceId || !filterDate) return { data: [], count: 0 };

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("agent_status_log")
        .select("*", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .gte("timestamp", `${filterDate}T00:00:00`)
        .lt("timestamp", `${filterDate}T23:59:59.999`)
        .order("timestamp", { ascending: false })
        .range(from, to);

      if (searchQuery) {
        query = query.ilike("agent_display_name", `%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: (data || []) as AgentActivity[], count: count || 0 };
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
