import { useQuery } from "@tanstack/react-query";
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
  
  // All Time Stats
  allTimeStoresAdded: number;
  allTimeSales: number;
  allTimeRevenue: number;
  allTimeSurveys: number;
  allTimeGiveaways: number;
  allTimeGiveawayItems: number;
  allTimeCheckIns: number;
  allTimeNotesCount: number;
  allTimeInteractionsCount: number;
  allTimeStoreVisits: number;
  allTimeWholesaleSales: number;
  allTimeWholesaleRevenue: number;
  
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

  // Reports (daily_stock_reports)
  todayReportsCount: number;
  allTimeReportsCount: number;
  
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

const hasQueryErrors = (results: Array<{ error?: unknown } | null | undefined>) => {
  const errors = results
    .map(result => result?.error)
    .filter(Boolean);

  if (errors.length === 0) {
    return false;
  }

  errors.forEach(error => console.error('Agent profile stats query error:', error));
  return true;
};

type AgentProfileStatsData = Omit<AgentProfileStats, "isLoading">;

type MetricPeriod = {
  interaction_units: number;
  interaction_revenue: number;
  daily_units: number;
  daily_revenue: number;
  giveaway_count: number;
  giveaway_items: number;
  wholesale_units: number;
  wholesale_revenue: number;
};

type MetricAggregates = {
  today: MetricPeriod;
  week: MetricPeriod;
  all_time: MetricPeriod;
};

const EMPTY_METRIC_PERIOD: MetricPeriod = {
  interaction_units: 0,
  interaction_revenue: 0,
  daily_units: 0,
  daily_revenue: 0,
  giveaway_count: 0,
  giveaway_items: 0,
  wholesale_units: 0,
  wholesale_revenue: 0,
};

const parseMetricAggregates = (raw: unknown): MetricAggregates => {
  const data = raw as Record<string, Record<string, number>> | null;
  const parsePeriod = (key: string): MetricPeriod => ({
    interaction_units: Number(data?.[key]?.interaction_units) || 0,
    interaction_revenue: Number(data?.[key]?.interaction_revenue) || 0,
    daily_units: Number(data?.[key]?.daily_units) || 0,
    daily_revenue: Number(data?.[key]?.daily_revenue) || 0,
    giveaway_count: Number(data?.[key]?.giveaway_count) || 0,
    giveaway_items: Number(data?.[key]?.giveaway_items) || 0,
    wholesale_units: Number(data?.[key]?.wholesale_units) || 0,
    wholesale_revenue: Number(data?.[key]?.wholesale_revenue) || 0,
  });
  return {
    today: parsePeriod("today"),
    week: parsePeriod("week"),
    all_time: parsePeriod("all_time"),
  };
};

const DEFAULT_STATS_DATA: AgentProfileStatsData = {
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
  allTimeStoresAdded: 0,
  allTimeSales: 0,
  allTimeRevenue: 0,
  allTimeSurveys: 0,
  allTimeGiveaways: 0,
  allTimeGiveawayItems: 0,
  allTimeCheckIns: 0,
  allTimeNotesCount: 0,
  allTimeInteractionsCount: 0,
  allTimeStoreVisits: 0,
  allTimeWholesaleSales: 0,
  allTimeWholesaleRevenue: 0,
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
  todayReportsCount: 0,
  allTimeReportsCount: 0,
};

export const useAgentProfileStats = (overrideAgentId?: string): AgentProfileStats => {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId, isInitialized } = useWorkspace();
  const agentId = overrideAgentId || user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["agent-profile-stats", agentId, currentWorkspaceId, currentProjectId],
    enabled: Boolean(isInitialized && agentId && currentWorkspaceId),
    staleTime: 60_000,
    queryFn: async (): Promise<AgentProfileStatsData> => {
      const todayStart = getStartOfDay();
      const weekStart = getStartOfWeek();
      const todayDate = getTodayDateString();
      const weekStartDate = weekStart.split('T')[0];
      const surveyDateFilter = (startDate: string) =>
        `completed_at.gte.${startDate},and(completed_at.is.null,created_at.gte.${startDate})`;

      try {
        const [
          userRoleData,
          rankData,
          todayStores,
          weekStores,
          metricAggregatesResult,
          todaySurveys,
          weekSurveys,
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
          // All Time queries
          allTimeStores,
          allTimeSurveyData,
          allTimeCheckInsData,
          allTimeNotesData,
          allTimeInteractionsData,
          allTimeStoreVisitsData,
          surveyCheck,
          todayReports,
          allTimeReports,
        ] = await Promise.all([
          // User role and display name
          supabase
            .from('user_roles')
            .select('display_name, first_name, last_name')
            .eq('user_id', agentId)
            .eq('is_active', true)
            .eq('workspace_id', currentWorkspaceId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Rank data
          supabase
            .from('agent_ranks')
            .select('current_rank, total_points, weekly_points, monthly_points')
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Today's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
             .eq('added_by', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),
          
          // Week's stores added
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),
          
          // Sales, giveaways, and wholesale totals in one SQL aggregate (was 12
          // unbounded row fetches summed client-side).
          supabase.rpc("get_agent_metric_aggregates", {
            p_agent_id: agentId,
            p_workspace_id: currentWorkspaceId,
            p_project_id: currentProjectId,
            p_today_start: todayStart,
            p_week_start: weekStart,
            p_today_date: todayDate,
            p_week_start_date: weekStartDate,
          }),
          
          // Today's surveys
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_completed', true)
            .not('is_deleted', 'is', true)
            .or(surveyDateFilter(todayStart)),
          
          // Week's surveys
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_completed', true)
            .not('is_deleted', 'is', true)
            .or(surveyDateFilter(weekStart)),
          
          // Today's status logs for work time (same calculation as WorkHoursCard)
          supabase
            .from('agent_status_log')
            .select('status, timestamp')
             .eq('agent_id', agentId)
            .gte('timestamp', todayStart)
            .order('timestamp', { ascending: true }),
          
          // Week's status logs for work time
          supabase
            .from('agent_status_log')
            .select('status, timestamp')
             .eq('agent_id', agentId)
            .gte('timestamp', weekStart)
            .order('timestamp', { ascending: true }),

          // ====== NEW QUERIES ======

          // Today's check-ins (status = 'checked_in')
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .gte('timestamp', todayStart),

          // Week's check-ins
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .gte('timestamp', weekStart),

          // Today's notes
          supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Week's notes
          supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),

          // Today's all interactions count
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Week's all interactions count
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', weekStart),

          // Today's store visits (check-ins with store_id)
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .not('store_id', 'is', null)
            .gte('timestamp', todayStart),

          // Week's store visits
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
             .eq('agent_id', agentId)
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
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true)
            .gte('created_at', todayStart),

          // Today's report summary
          supabase
            .from('agent_report_summary')
            .select('net_work_minutes, total_work_minutes, total_lunch_minutes, check_ins_count, interactions_count, notes_count')
             .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('report_date', todayDate)
            .maybeSingle(),

          // === ALL TIME QUERIES ===

          // All time stores
          supabase
            .from('stores')
            .select('id', { count: 'exact', head: true })
            .eq('added_by', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true),

          // All time surveys
          supabase
            .from('survey_responses')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_completed', true)
            .not('is_deleted', 'is', true),

          // All time check-ins
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in'),

          // All time notes
          supabase
            .from('notes')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true),

          // All time interactions
          supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .not('is_deleted', 'is', true),

          // All time store visits
          supabase
            .from('agent_status_log')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('status', 'checked_in')
            .not('store_id', 'is', null),

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

          // Today's reports (daily_stock_reports)
          supabase
            .from('daily_stock_reports')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId)
            .eq('work_date', todayDate),

          // All time reports (daily_stock_reports)
          supabase
            .from('daily_stock_reports')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('workspace_id', currentWorkspaceId),
        ]);

        if (hasQueryErrors([
          userRoleData,
          rankData,
          todayStores,
          weekStores,
          metricAggregatesResult,
          todaySurveys,
          weekSurveys,
          todayWorkSegments,
          weekWorkSegments,
          todayCheckIns,
          weekCheckIns,
          todayNotes,
          weekNotes,
          todayInteractions,
          weekInteractions,
          todayStoreVisits,
          weekStoreVisits,
          todayTasks,
          reportSummary,
          allTimeStores,
          allTimeSurveyData,
          allTimeCheckInsData,
          allTimeNotesData,
          allTimeInteractionsData,
          allTimeStoreVisitsData,
          surveyCheck as any,
          todayReports as any,
          allTimeReports as any,
        ])) {
          return DEFAULT_STATS_DATA;
        }

        const metrics = metricAggregatesResult.error
          ? { today: EMPTY_METRIC_PERIOD, week: EMPTY_METRIC_PERIOD, all_time: EMPTY_METRIC_PERIOD }
          : parseMetricAggregates(metricAggregatesResult.data);

        // Calculate totals from SQL aggregates (sales / giveaways / wholesale).
        const todayInteractionSalesUnits = metrics.today.interaction_units;
        const weekInteractionSalesUnits = metrics.week.interaction_units;
        const todayDailySalesUnits = metrics.today.daily_units;
        const weekDailySalesUnits = metrics.week.daily_units;
        const todayRevenueTotal = metrics.today.interaction_revenue + metrics.today.daily_revenue;
        const weekRevenueTotal = metrics.week.interaction_revenue + metrics.week.daily_revenue;
        const todayGiveawayItemsTotal = metrics.today.giveaway_items;
        const weekGiveawayItemsTotal = metrics.week.giveaway_items;
        // Calculate work minutes from status logs (same logic as WorkHoursCard)
        const calculateWorkMinutesFromLogs = (logs: any[] | null) => {
          if (!logs || logs.length === 0) return { work: 0, lunch: 0 };
          let workMinutes = 0;
          let lunchMinutes = 0;
          let currentCheckIn: any = null;
          let currentLunchStart: any = null;

          logs.forEach(log => {
            if (log.status === 'checked_in' && !currentCheckIn) {
              currentCheckIn = log;
              // End lunch if active
              if (currentLunchStart) {
                const start = new Date(currentLunchStart.timestamp).getTime();
                const end = new Date(log.timestamp).getTime();
                lunchMinutes += Math.max(0, (end - start) / 60000);
                currentLunchStart = null;
              }
            } else if (log.status === 'lunch' && currentCheckIn) {
              const checkInTime = new Date(currentCheckIn.timestamp).getTime();
              const checkOutTime = new Date(log.timestamp).getTime();
              workMinutes += Math.max(0, (checkOutTime - checkInTime) / 60000);
              currentCheckIn = null;
              currentLunchStart = log;
            } else if (log.status === 'checked_out' && currentCheckIn) {
              const checkInTime = new Date(currentCheckIn.timestamp).getTime();
              const checkOutTime = new Date(log.timestamp).getTime();
              workMinutes += Math.max(0, (checkOutTime - checkInTime) / 60000);
              currentCheckIn = null;
            }
          });

          // If still checked in
          if (currentCheckIn) {
            const checkInTime = new Date(currentCheckIn.timestamp).getTime();
            workMinutes += Math.max(0, (Date.now() - checkInTime) / 60000);
          }
          if (currentLunchStart) {
            const start = new Date(currentLunchStart.timestamp).getTime();
            lunchMinutes += Math.max(0, (Date.now() - start) / 60000);
          }

          return { work: Math.round(workMinutes), lunch: Math.round(lunchMinutes) };
        };

        const todayCalc = calculateWorkMinutesFromLogs(todayWorkSegments.data);
        const weekCalc = calculateWorkMinutesFromLogs(weekWorkSegments.data);
        const todayWorkMinutesTotal = todayCalc.work;
        const weekWorkMinutesTotal = weekCalc.work;
        const weekLunchMinutesTotal = weekCalc.lunch;
        
        const displayName = userRoleData.data?.display_name
          || [userRoleData.data?.first_name, userRoleData.data?.last_name].filter(Boolean).join(' ')
          || user?.user_metadata?.full_name
          || user?.email?.split('@')[0]
          || "Agent";

        // Tasks
        const tasks = todayTasks.data || [];
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const pendingTasks = tasks.filter(t => t.status === 'pending').length;

        // Report summary
        const report = reportSummary.data;

        // Wholesale calculations
        const todayWsSales = metrics.today.wholesale_units;
        const todayWsRevenue = metrics.today.wholesale_revenue;
        const weekWsSales = metrics.week.wholesale_units;
        const weekWsRevenue = metrics.week.wholesale_revenue;
        const hasSurvey = ((surveyCheck as any)?.count || 0) > 0;

        // All Time calculations
        const allTimeSalesUnits = metrics.all_time.interaction_units + metrics.all_time.daily_units;
        const allTimeRevenueTotal = metrics.all_time.interaction_revenue + metrics.all_time.daily_revenue;
        const allTimeGiveawayItemsTotal = metrics.all_time.giveaway_items;
        const allTimeWsSales = metrics.all_time.wholesale_units;
        const allTimeWsRevenue = metrics.all_time.wholesale_revenue;

        return {
          displayName,
          email: user?.email || "",
          currentRank: rankData.data?.current_rank || "Agent",
          totalPoints: rankData.data?.total_points || 0,
          weeklyPoints: rankData.data?.weekly_points || 0,
          monthlyPoints: rankData.data?.monthly_points || 0,
          todayStoresAdded: todayStores.count || 0,
          todaySales: todayInteractionSalesUnits + todayDailySalesUnits,
          todayRevenue: todayRevenueTotal,
          todaySurveys: todaySurveys.count || 0,
          todayGiveaways: metrics.today.giveaway_count,
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
          weekGiveaways: metrics.week.giveaway_count,
          weekGiveawayItems: weekGiveawayItemsTotal,
          weekWorkMinutes: weekWorkMinutesTotal,
          weekCheckIns: weekCheckIns.count || 0,
          weekNotesCount: weekNotes.count || 0,
          weekInteractionsCount: weekInteractions.count || 0,
          weekStoreVisits: weekStoreVisits.count || 0,
          weekLunchMinutes: weekLunchMinutesTotal,
          allTimeStoresAdded: (allTimeStores as any)?.count || 0,
          allTimeSales: allTimeSalesUnits,
          allTimeRevenue: allTimeRevenueTotal,
          allTimeSurveys: (allTimeSurveyData as any)?.count || 0,
          allTimeGiveaways: metrics.all_time.giveaway_count,
          allTimeGiveawayItems: allTimeGiveawayItemsTotal,
          allTimeCheckIns: (allTimeCheckInsData as any)?.count || 0,
          allTimeNotesCount: (allTimeNotesData as any)?.count || 0,
          allTimeInteractionsCount: (allTimeInteractionsData as any)?.count || 0,
          allTimeStoreVisits: (allTimeStoreVisitsData as any)?.count || 0,
          allTimeWholesaleSales: allTimeWsSales,
          allTimeWholesaleRevenue: allTimeWsRevenue,
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
          todayReportsCount: (todayReports as any)?.count || 0,
          allTimeReportsCount: (allTimeReports as any)?.count || 0,
        };
      } catch (error) {
        console.error('Error fetching agent profile stats:', error);
        return DEFAULT_STATS_DATA;
      }
    },
  });

  return {
    ...(data ?? DEFAULT_STATS_DATA),
    isLoading,
  };
};