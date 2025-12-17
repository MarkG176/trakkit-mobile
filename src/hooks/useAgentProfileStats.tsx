import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
      if (!user) return;

      const todayStart = getStartOfDay();
      const weekStart = getStartOfWeek();
      const todayDate = getTodayDateString();

      try {
        const [
          userRoleData,
          rankData,
          todayStores,
          weekStores,
          todaySales,
          weekSales,
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
            .select('display_name')
            .eq('user_id', user.id)
            .single(),
          
          // Rank data
          supabase
            .from('agent_ranks')
            .select('current_rank, total_points, weekly_points, monthly_points')
            .eq('agent_id', user.id)
            .single(),
          
          // Today's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', user.id)
            .gte('created_at', todayStart),
          
          // Week's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', user.id)
            .gte('created_at', weekStart),
          
          // Today's sales
          supabase
            .from('interactions')
            .select('id, sale_value')
            .eq('agent_id', user.id)
            .eq('interaction_type', 'sale')
            .gte('created_at', todayStart),
          
          // Week's sales
          supabase
            .from('interactions')
            .select('id, sale_value')
            .eq('agent_id', user.id)
            .eq('interaction_type', 'sale')
            .gte('created_at', weekStart),
          
          // Today's surveys
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('interaction_type', 'survey')
            .gte('created_at', todayStart),
          
          // Week's surveys
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('interaction_type', 'survey')
            .gte('created_at', weekStart),
          
          // Today's giveaways
          supabase
            .from('giveaways')
            .select('id, total_items')
            .eq('agent_id', user.id)
            .gte('created_at', todayStart),
          
          // Week's giveaways
          supabase
            .from('giveaways')
            .select('id, total_items')
            .eq('agent_id', user.id)
            .gte('created_at', weekStart),
          
          // Today's work segments
          supabase
            .from('agent_work_segments')
            .select('duration_minutes')
            .eq('agent_id', user.id)
            .eq('work_date', todayDate),
          
          // Week's work segments
          supabase
            .from('agent_work_segments')
            .select('duration_minutes')
            .eq('agent_id', user.id)
            .gte('work_date', weekStart.split('T')[0]),
        ]);

        // Calculate totals
        const todayRevenueTotal = todaySales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0;
        const weekRevenueTotal = weekSales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0;
        const todayGiveawayItemsTotal = todayGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const weekGiveawayItemsTotal = weekGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const todayWorkMinutesTotal = todayWorkSegments.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
        const weekWorkMinutesTotal = weekWorkSegments.data?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;

        setStats({
          displayName: userRoleData.data?.display_name || user.email?.split('@')[0] || "Agent",
          email: user.email || "",
          currentRank: rankData.data?.current_rank || "Agent",
          totalPoints: rankData.data?.total_points || 0,
          weeklyPoints: rankData.data?.weekly_points || 0,
          monthlyPoints: rankData.data?.monthly_points || 0,
          todayStoresAdded: todayStores.count || 0,
          todaySales: todaySales.data?.length || 0,
          todayRevenue: todayRevenueTotal,
          todaySurveys: todaySurveys.count || 0,
          todayGiveaways: todayGiveaways.data?.length || 0,
          todayGiveawayItems: todayGiveawayItemsTotal,
          todayWorkMinutes: todayWorkMinutesTotal,
          weekStoresAdded: weekStores.count || 0,
          weekSales: weekSales.data?.length || 0,
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

    fetchStats();
  }, [user]);

  return stats;
};
