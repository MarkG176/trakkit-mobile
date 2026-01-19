import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspace } from '@/hooks/useWorkspace';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveKPIData {
  agentsOnline: number;
  totalAgents: number;
  salesCount: number;
  salesValue: number;
  storesVisited: number;
  activeProjects: number;
}

export interface AgentStatusEvent {
  id: string;
  agentId: string;
  agentName: string;
  agentInitials: string;
  status: 'checked_in' | 'checked_out' | 'lunch' | 'break';
  timestamp: string;
  locationLat?: number;
  locationLng?: number;
  selfieUrl?: string;
  distanceFromAssigned?: number;
  inRange?: boolean;
}

export interface SaleEvent {
  id: string;
  agentId: string;
  agentName: string;
  productName: string;
  quantity: number;
  value: number;
  timestamp: string;
}

export const useSupervisorRealtime = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [kpis, setKpis] = useState<LiveKPIData>({
    agentsOnline: 0,
    totalAgents: 0,
    salesCount: 0,
    salesValue: 0,
    storesVisited: 0,
    activeProjects: 0,
  });
  const [agentStatusFeed, setAgentStatusFeed] = useState<AgentStatusEvent[]>([]);
  const [salesFeed, setSalesFeed] = useState<SaleEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const agentCacheRef = useRef<Map<string, { name: string; initials: string }>>(new Map());

  const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    return { todayStart, todayEnd: todayEnd.toISOString(), todayDate: today.toISOString().split('T')[0] };
  };

  const getAgentInfo = async (agentId: string): Promise<{ name: string; initials: string }> => {
    if (agentCacheRef.current.has(agentId)) {
      return agentCacheRef.current.get(agentId)!;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('display_name, email')
      .eq('user_id', agentId)
      .single();

    const name = data?.display_name || data?.email?.split('@')[0] || 'Unknown';
    const initials = name.substring(0, 2).toUpperCase();
    const info = { name, initials };
    agentCacheRef.current.set(agentId, info);
    return info;
  };

  const fetchInitialData = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      setLoading(true);
      const { todayStart, todayEnd, todayDate } = getTodayRange();

      // Parallel fetch all initial data
      const [
        agentsResult,
        statusResult,
        salesResult,
        storesResult,
        projectsResult,
        statusFeedResult,
        salesFeedResult,
      ] = await Promise.all([
        // Total agents in workspace
        supabase
          .from('user_workspaces')
          .select('user_id')
          .eq('workspace_id', currentWorkspaceId)
          .eq('role', 'agent')
          .eq('is_active', true),
        
        // Agents online today (checked in)
        supabase
          .from('agent_status_log')
          .select('agent_id')
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', todayStart)
          .lte('timestamp', todayEnd),
        
        // Sales today
        supabase
          .from('daily_sales_tracking')
          .select('quantity_sold, total_value')
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', todayDate),
        
        // Stores visited today
        supabase
          .from('interactions')
          .select('store_id')
          .eq('workspace_id', currentWorkspaceId)
          .gte('created_at', todayStart)
          .not('store_id', 'is', null),
        
        // Active projects
        supabase
          .from('project_plans')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', currentWorkspaceId)
          .eq('status', 'active'),
        
        // Status feed (last 50)
        supabase
          .from('agent_status_log')
          .select('id, agent_id, agent_display_name, status, timestamp, location_lat, location_lng, selfie_url, distance_from_assigned, in_range')
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', todayStart)
          .order('timestamp', { ascending: false })
          .limit(50),
        
        // Sales feed (last 30)
        supabase
          .from('daily_sales_tracking')
          .select('id, agent_id, agent_name, product_name, quantity_sold, total_value, recorded_at')
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', todayDate)
          .order('recorded_at', { ascending: false })
          .limit(30),
      ]);

      // Process KPIs
      const totalAgents = agentsResult.data?.length || 0;
      const uniqueActiveAgents = new Set(statusResult.data?.map(s => s.agent_id) || []);
      const agentsOnline = uniqueActiveAgents.size;
      const salesCount = salesResult.data?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
      const salesValue = salesResult.data?.reduce((sum, s) => sum + s.total_value, 0) || 0;
      const uniqueStores = new Set(storesResult.data?.map(s => s.store_id) || []);
      const storesVisited = uniqueStores.size;
      const activeProjects = projectsResult.count || 0;

      setKpis({
        agentsOnline,
        totalAgents,
        salesCount,
        salesValue,
        storesVisited,
        activeProjects,
      });

      // Process status feed
      const statusEvents: AgentStatusEvent[] = await Promise.all(
        (statusFeedResult.data || []).map(async (log) => {
          const agentInfo = log.agent_display_name 
            ? { name: log.agent_display_name, initials: log.agent_display_name.substring(0, 2).toUpperCase() }
            : await getAgentInfo(log.agent_id);
          
          return {
            id: log.id,
            agentId: log.agent_id,
            agentName: agentInfo.name,
            agentInitials: agentInfo.initials,
            status: log.status as AgentStatusEvent['status'],
            timestamp: log.timestamp,
            locationLat: log.location_lat ?? undefined,
            locationLng: log.location_lng ?? undefined,
            selfieUrl: log.selfie_url ?? undefined,
            distanceFromAssigned: log.distance_from_assigned ?? undefined,
            inRange: log.in_range ?? undefined,
          };
        })
      );
      setAgentStatusFeed(statusEvents);

      // Process sales feed
      const salesEvents: SaleEvent[] = (salesFeedResult.data || []).map(sale => ({
        id: sale.id,
        agentId: sale.agent_id,
        agentName: sale.agent_name || 'Unknown',
        productName: sale.product_name || 'Unknown Product',
        quantity: sale.quantity_sold,
        value: sale.total_value,
        timestamp: sale.recorded_at,
      }));
      setSalesFeed(salesEvents);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching supervisor data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId]);

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!currentWorkspaceId) return;

    // Clean up existing channels
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Agent status channel
    const statusChannel = supabase
      .channel(`supervisor-agent-status-${currentWorkspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'agent_status_log',
        filter: `workspace_id=eq.${currentWorkspaceId}`,
      }, async (payload) => {
        const log = payload.new as any;
        const agentInfo = log.agent_display_name 
          ? { name: log.agent_display_name, initials: log.agent_display_name.substring(0, 2).toUpperCase() }
          : await getAgentInfo(log.agent_id);

        const newEvent: AgentStatusEvent = {
          id: log.id,
          agentId: log.agent_id,
          agentName: agentInfo.name,
          agentInitials: agentInfo.initials,
          status: log.status,
          timestamp: log.timestamp,
          locationLat: log.location_lat,
          locationLng: log.location_lng,
          selfieUrl: log.selfie_url,
          distanceFromAssigned: log.distance_from_assigned,
          inRange: log.in_range,
        };

        setAgentStatusFeed(prev => [newEvent, ...prev].slice(0, 50));
        
        // Update online count
        if (log.status === 'checked_in') {
          setKpis(prev => ({ ...prev, agentsOnline: prev.agentsOnline + 1 }));
        } else if (log.status === 'checked_out') {
          setKpis(prev => ({ ...prev, agentsOnline: Math.max(0, prev.agentsOnline - 1) }));
        }
        
        setLastUpdated(new Date());
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Sales channel
    const salesChannel = supabase
      .channel(`supervisor-sales-${currentWorkspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'daily_sales_tracking',
        filter: `workspace_id=eq.${currentWorkspaceId}`,
      }, (payload) => {
        const sale = payload.new as any;
        
        const newSale: SaleEvent = {
          id: sale.id,
          agentId: sale.agent_id,
          agentName: sale.agent_name || 'Unknown',
          productName: sale.product_name || 'Unknown Product',
          quantity: sale.quantity_sold,
          value: sale.total_value,
          timestamp: sale.recorded_at,
        };

        setSalesFeed(prev => [newSale, ...prev].slice(0, 30));
        setKpis(prev => ({
          ...prev,
          salesCount: prev.salesCount + sale.quantity_sold,
          salesValue: prev.salesValue + sale.total_value,
        }));
        setLastUpdated(new Date());
      })
      .subscribe();

    // Store interactions channel for store count
    const storesChannel = supabase
      .channel(`supervisor-stores-${currentWorkspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'interactions',
        filter: `workspace_id=eq.${currentWorkspaceId}`,
      }, (payload) => {
        const interaction = payload.new as any;
        if (interaction.store_id) {
          // Increment store count (simplified - in reality would need to check uniqueness)
          setLastUpdated(new Date());
        }
      })
      .subscribe();

    channelsRef.current = [statusChannel, salesChannel, storesChannel];
  }, [currentWorkspaceId]);

  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchInitialData();
    setupRealtimeSubscriptions();

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [currentWorkspaceId, fetchInitialData, setupRealtimeSubscriptions]);

  return {
    kpis,
    agentStatusFeed,
    salesFeed,
    isConnected,
    loading,
    lastUpdated,
    refresh,
  };
};
