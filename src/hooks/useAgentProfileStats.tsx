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
  todayCheckIns: number;
  todayNotesCount: number;
  todayInteractionsCount: number;
  todayStoreVisits: number;
  
  // Weekly Stats
  weekStoresAdded: number;
  weekSales: number;
  weekRevenue: number;
  weekSurveys: number;
  weekGiveaways: number;
  weekGiveawayItems: number;
  weekWorkMinutes: number;
  weekCheckIns: number;
  weekNotesCount: number;
  weekInteractionsCount: number;
  weekStoreVisits: number;
  weekLunchMinutes: number;
  
  // Tasks
  todayTotalTasks: number;
  todayCompletedTasks: number;
  todayPendingTasks: number;
  
  // Report summary (from agent_report_summary)
  reportNetWorkMinutes: number;
  reportTotalWorkMinutes: number;
  reportTotalLunchMinutes: number;
  reportCheckInsCount: number;
  reportInteractionsCount: number;
  reportNotesCount: number;

  // Wholesale-specific
  todayWholesaleSales: number;
  todayWholesaleRevenue: number;
  weekWholesaleSales: number;
  weekWholesaleRevenue: number;
  hasSurveyAssigned: boolean;
  
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
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
};

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useAgentProfileStats = (): AgentProfileStats => {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId, isInitialized } = useWorkspace();
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
    todayCheckIns: 0,
    todayNotesCount: 0,
    todayInteractionsCount: 0,
    todayStoreVisits: 0,
    weekStoresAdded: 0,
    weekSales: 0,
    weekRevenue: 0,
    weekSurveys: 0,
    weekGiveaways: 0,
    weekGiveawayItems: 0,
    weekWorkMinutes: 0,
    weekCheckIns: 0,
    weekNotesCount: 0,
    weekInteractionsCount: 0,
    weekStoreVisits: 0,
    weekLunchMinutes: 0,
    todayTotalTasks: 0,
    todayCompletedTasks: 0,
    todayPendingTasks: 0,
    reportNetWorkMinutes: 0,
    reportTotalWorkMinutes: 0,
    reportTotalLunchMinutes: 0,
    reportCheckInsCount: 0,
    reportInteractionsCount: 0,
    reportNotesCount: 0,
    todayWholesaleSales: 0,
    todayWholesaleRevenue: 0,
    weekWholesaleSales: 0,
    weekWholesaleRevenue: 0,
    hasSurveyAssigned: false,
    isLoading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !currentWorkspaceId) {
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
          // New queries
          todayCheckIns,
          weekCheckIns,
          todayNotes,
          weekNotes,
          todayInteractions,
          weekInteractions,
          todayStoreVisits,
          weekStoreVisits,
          weekLunchSegments,
          todayTasks,
          reportSummary,
          todayWholesalePurchases,
          weekWholesalePurchases,
          surveyCheck,
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
          
          // Today's work segments (all types: work + lunch)
          supabase
            .from('agent_work_segments')
            .select('duration_minutes, segment_start, segment_end, segment_type')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('work_date', todayDate),
          
          // Week's work segments (all types: work + lunch)
          supabase
            .from('agent_work_segments')
            .select('duration_minutes, segment_start, segment_end, segment_type')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .gte('work_date', weekStartDate),

          // ====== NEW QUERIES ======

          // Today's check-ins (status = 'checked_in')
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .gte('timestamp', todayStart),

          // Week's check-ins
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .gte('timestamp', weekStart),

          // Today's notes
          supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Week's notes
          supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),

          // Today's all interactions count
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Week's all interactions count
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),

          // Today's store visits (check-ins with store_id)
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .not('store_id', 'is', null)
            .gte('timestamp', todayStart),

          // Week's store visits
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .not('store_id', 'is', null)
            .gte('timestamp', weekStart),

          // Week's lunch segments (now covered by weekWorkSegments above)
          Promise.resolve({ data: [] }),

          // Today's tasks
          supabase
            .from('agent_tasks')
            .select('id, status')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Today's report summary
          supabase
            .from('agent_report_summary')
            .select('net_work_minutes, total_work_minutes, total_lunch_minutes, check_ins_count, interactions_count, notes_count')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .eq('report_date', todayDate)
            .maybeSingle(),

          // Today's wholesale sales (customer_purchases)
          supabase
            .from('customer_purchases')
            .select('quantity, total_value')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .gte('purchase_date', todayStart),

          // Week's wholesale sales (customer_purchases)
          supabase
            .from('customer_purchases')
            .select('quantity, total_value')
            .eq('agent_id', user.id)
            .eq('workspace_id', currentWorkspaceId)
            .gte('purchase_date', weekStart),

          // Check if project has survey templates assigned
          ...(currentProjectId ? [
            supabase
              .from('interactions')
              .select('id', { count: 'exact', head: true })
              .eq('workspace_id', currentWorkspaceId)
              .eq('interaction_type', 'survey')
              .not('survey_template_id', 'is', null)
              .limit(1)
          ] : [Promise.resolve({ count: 0 })]),
        ]);

        // Calculate totals
        const todayInteractionSalesUnits = todaySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0), 0) || 0;
        const weekInteractionSalesUnits = weekSales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0), 0) || 0;
        const todayDailySalesUnits = todayDailySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0), 0) || 0;
        const weekDailySalesUnits = weekDailySales.data?.reduce(
          (sum, s) => sum + (Number(s.quantity_sold) || 0), 0) || 0;
        const todayRevenueTotal =
          (todaySales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0) +
          (todayDailySales.data?.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0) || 0);
        const weekRevenueTotal =
          (weekSales.data?.reduce((sum, s) => sum + (Number(s.sale_value) || 0), 0) || 0) +
          (weekDailySales.data?.reduce((sum, s) => sum + (Number(s.total_value) || 0), 0) || 0);
        const todayGiveawayItemsTotal = todayGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const weekGiveawayItemsTotal = weekGiveaways.data?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
        const calcSegmentMinutes = (segments: any[] | null, typeFilter?: string) => {
          if (!segments) return 0;
          const filtered = typeFilter ? segments.filter(s => s.segment_type === typeFilter) : segments;
          return filtered.reduce((sum, s) => {
            if (s.duration_minutes && s.duration_minutes > 0) {
              return sum + s.duration_minutes;
            }
            // For active segments (no end time), calculate elapsed time
            if (s.segment_start && !s.segment_end) {
              const elapsed = Math.floor((Date.now() - new Date(s.segment_start).getTime()) / 60000);
              return sum + Math.max(0, elapsed);
            }
            return sum;
          }, 0);
        };
        // net_work_minutes = total_work_minutes - total_lunch_minutes
        const todayTotalWork = calcSegmentMinutes(todayWorkSegments.data, 'work');
        const todayTotalLunch = calcSegmentMinutes(todayWorkSegments.data, 'lunch');
        const todayWorkMinutesTotal = todayTotalWork - todayTotalLunch;
        const weekTotalWork = calcSegmentMinutes(weekWorkSegments.data, 'work');
        const weekTotalLunch = calcSegmentMinutes(weekWorkSegments.data, 'lunch');
        const weekWorkMinutesTotal = weekTotalWork - weekTotalLunch;
        const weekLunchMinutesTotal = weekTotalLunch;
        
        const displayName = userRoleData.data?.display_name
          || [userRoleData.data?.first_name, userRoleData.data?.last_name].filter(Boolean).join(' ')
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || "Agent";

        // Tasks
        const tasks = todayTasks.data || [];
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;

        // Report summary
        const report = reportSummary.data;

        // Wholesale calculations
        const todayWsPurchases = (todayWholesalePurchases as any)?.data || [];
        const weekWsPurchases = (weekWholesalePurchases as any)?.data || [];
        const todayWsSales = todayWsPurchases.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0);
        const todayWsRevenue = todayWsPurchases.reduce((sum: number, p: any) => sum + (Number(p.total_value) || 0), 0);
        const weekWsSales = weekWsPurchases.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0);
        const weekWsRevenue = weekWsPurchases.reduce((sum: number, p: any) => sum + (Number(p.total_value) || 0), 0);
        const hasSurvey = ((surveyCheck as any)?.count || 0) > 0;

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
          todayCheckIns: todayCheckIns.count || 0,
          todayNotesCount: todayNotes.count || 0,
          todayInteractionsCount: todayInteractions.count || 0,
          todayStoreVisits: todayStoreVisits.count || 0,
          weekStoresAdded: weekStores.count || 0,
          weekSales: weekInteractionSalesUnits + weekDailySalesUnits,
          weekRevenue: weekRevenueTotal,
          weekSurveys: weekSurveys.count || 0,
          weekGiveaways: weekGiveaways.data?.length || 0,
          weekGiveawayItems: weekGiveawayItemsTotal,
          weekWorkMinutes: weekWorkMinutesTotal,
          weekCheckIns: weekCheckIns.count || 0,
          weekNotesCount: weekNotes.count || 0,
          weekInteractionsCount: weekInteractions.count || 0,
          weekStoreVisits: weekStoreVisits.count || 0,
          weekLunchMinutes: weekLunchMinutesTotal,
          todayTotalTasks: tasks.length,
          todayCompletedTasks: completedTasks,
          todayPendingTasks: pendingTasks,
          reportNetWorkMinutes: report?.net_work_minutes || 0,
          reportTotalWorkMinutes: report?.total_work_minutes || 0,
          reportTotalLunchMinutes: report?.total_lunch_minutes || 0,
          reportCheckInsCount: report?.check_ins_count || 0,
          reportInteractionsCount: report?.interactions_count || 0,
          reportNotesCount: report?.notes_count || 0,
          todayWholesaleSales: todayWsSales,
          todayWholesaleRevenue: todayWsRevenue,
          weekWholesaleSales: weekWsSales,
          weekWholesaleRevenue: weekWsRevenue,
          hasSurveyAssigned: hasSurvey,
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
