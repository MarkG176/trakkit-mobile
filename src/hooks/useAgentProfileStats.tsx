import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";

export interface AgentProfileStats {
  // Profile Info
  displayName: string;
  email: string;
  
  // Rank & Points
  currentRank: string;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  
  // Today's Stats
  todayStoresAdded: number;
  todaySales: number;
  todayRevenue: number;
  todaySurveys: number;
  todayGiveaways: number;
  todayGiveawayItems: number;
  todayWorkMinutes: number;
  
  // Weekly Stats
  weekStoresAdded: number;
  weekSales: number;
  weekRevenue: number;
  weekSurveys: number;
  weekGiveaways: number;
  weekGiveawayItems: number;
  weekWorkMinutes: number;
  
  // Loading state
  isLoading: boolean;
}

const getStartOfDay = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

const getStartOfWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useAgentProfileStats = (): AgentProfileStats => {
  const { user } = useAuth();
  const { currentWorkspaceId, isInitialized } = useWorkspace();
  const [stats, setStats] = useState<AgentProfileStats>({
    displayName: "",
    email: "",
    currentRank: "Agent",
    totalPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    todayStoresAdded: 0,
    todaySales: 0,
    todayRevenue: 0,
    todaySurveys: 0,
    todayGiveaways: 0,
    todayGiveawayItems: 0,
    todayWorkMinutes: 0,
    weekStoresAdded: 0,
    weekSales: 0,
    weekRevenue: 0,
    weekSurveys: 0,
    weekGiveaways: 0,
    weekGiveawayItems: 0,
    weekWorkMinutes: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (!currentWorkspaceId) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setStats(prev => ({ ...prev, isLoading: true }));
      const todayStart = getStartOfDay();
      const weekStart = getStartOfWeek();
      const todayDate = getTodayDateString();
      const weekStartDate = weekStart.split('T')[0];
      const salesDateFilter = (startDate: string) =>
        `timestamp.gte.${startDate},and(timestamp.is.null,created_at.gte.${startDate})`;
      const surveyDateFilter = (startDate: string) =>
        `completed_at.gte.${startDate},and(completed_at.is.null,created_at.gte.${startDate})`;

      try {
        const [
          userRoleData,
          rankData,
          todayStores,
          weekStores,
          todaySales,
          weekSales,
          todayDailySales,
          weekDailySales,
          todaySurveys,
          weekSurveys,
          todayGiveaways,
          weekGiveaways,
          todayWorkSegments,
          weekWorkSegments,
        ] = await Promise.all([
          // User role and display name
          supabase
            .from('user_roles')
            .select('display_name, first_name, last_name')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('workspace_id', currentWorkspaceId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Rank data
          supabase
            .from('agent_ranks')
            .select('current_rank, total_points, weekly_points, monthly_points')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Today's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),
          
          // Week's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),
          
          // Today's sales (interaction-based)
          supabase
            .from('interactions')
            .select('quantity_sold, sale_value, timestamp, created_at')
            .eq('agent_id', user.id)
            .eq('interaction_type', 'sale')
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .or(salesDateFilter(todayStart)),
          
          // Week's sales (interaction-based)
          supabase
            .from('interactions')
            .select('quantity_sold, sale_value, timestamp, created_at')
            .eq('agent_id', user.id)
            .eq('interaction_type', 'sale')
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .or(salesDateFilter(weekStart)),

          // Today's sales (daily tracking)
          supabase
            .from('daily_sales_tracking')
            .select('quantity_sold, total_value')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('work_date', todayDate),

          // Week's sales (daily tracking)
          supabase
            .from('daily_sales_tracking')
            .select('quantity_sold, total_value')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .gte('work_date', weekStartDate),
          
          // Today's surveys
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_completed', true)
            .not('is_deleted', 'is', true)
            .or(surveyDateFilter(todayStart)),
          
          // Week's surveys
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_completed', true)
            .not('is_deleted', 'is', true)
            .or(surveyDateFilter(weekStart)),
          
          // Today's giveaways
          supabase
            .from('giveaways')
            .select('id, total_items')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('recorded_at', todayStart),
          
          // Week's giveaways
          supabase
            .from('giveaways')
            .select('id, total_items')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('recorded_at', weekStart),
          
          // Today's work segments
          supabase
            .from('agent_work_segments')
            .select('duration_minutes')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('work_date', todayDate),
          
          // Week's work segments
          supabase
            .from('agent_work_segments')
            .select('duration_minutes')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .gte('work_date', weekStartDate),
        ]);

        // Calculate totals
        const todayInteractionSalesUnits = todaySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0),
          0
        ) || 0;
        const weekInteractionSalesUnits = weekSales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0),
          0
        ) || 0;
        const todayDailySalesUnits = todayDailySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0),
          0
        ) || 0;
        const weekDailySalesUnits = weekDailySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0),
          0
        ) || 0;
        const todayRevenueTotal =
          (todaySales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0) +
          (todayDailySales.data?.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0) || 0);
        const weekRevenueTotal =
          (weekSales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0) +
          (weekDailySales.data?.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0) || 0);
        const todayGiveawayItemsTotal = todayGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const weekGiveawayItemsTotal = weekGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const todayWorkMinutesTotal = todayWorkSegments.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
        const weekWorkMinutesTotal = weekWorkSegments.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
        const displayName = userRoleData.data?.display_name
          || [userRoleData.data?.first_name, userRoleData.data?.last_name].filter(Boolean).join(' ')
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || "Agent";

        setStats({
          displayName,
          email: user.email || "",
          currentRank: rankData.data?.current_rank || "Agent",
          totalPoints: rankData.data?.total_points || 0,
          weeklyPoints: rankData.data?.weekly_points || 0,
          monthlyPoints: rankData.data?.monthly_points || 0,
          todayStoresAdded: todayStores.count || 0,
          todaySales: todayInteractionSalesUnits + todayDailySalesUnits,
          todayRevenue: todayRevenueTotal,
          todaySurveys: todaySurveys.count || 0,
          todayGiveaways: todayGiveaways.data?.length || 0,
          todayGiveawayItems: todayGiveawayItemsTotal,
          todayWorkMinutes: todayWorkMinutesTotal,
          weekStoresAdded: weekStores.count || 0,
          weekSales: weekInteractionSalesUnits + weekDailySalesUnits,
          weekRevenue: weekRevenueTotal,
          weekSurveys: weekSurveys.count || 0,
          weekGiveaways: weekGiveaways.data?.length || 0,
          weekGiveawayItems: weekGiveawayItemsTotal,
          weekWorkMinutes: weekWorkMinutesTotal,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching agent profile stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    if (isInitialized) {
      fetchStats();
    }
  }, [user, currentWorkspaceId, isInitialized]);

  return stats;
};
