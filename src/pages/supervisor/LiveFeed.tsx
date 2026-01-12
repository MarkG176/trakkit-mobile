import { useState, useEffect, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { ActivityCard } from "@/components/supervisor/ActivityCard";
import { DateRangeSelector } from "@/components/supervisor/DateRangeSelector";
import { PaginationControls } from "@/components/supervisor/PaginationControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, Loader2, Activity, ShoppingCart, Gift, ClipboardCheck, LogIn, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface ActivityItem {
  id: string;
  type: 'check_in' | 'check_out' | 'sale' | 'giveaway' | 'survey' | 'break_start' | 'break_end';
  agentName: string;
  agentInitials: string;
  timestamp: string;
  location?: string;
  details?: string;
  value?: number;
  imageUrl?: string;
}

type FilterType = 'all' | 'check_in' | 'sale' | 'giveaway' | 'survey';

export const LiveFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRealtime, setIsRealtime] = useState(true);
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  
  const { preset, setPreset, setCustomRange, dateRange, startISO, endISO, dateLabel } = useDateRangeFilter('today');

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'check_in') return activity.type === 'check_in' || activity.type === 'check_out';
    return activity.type === filter;
  });

  const {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ items: filteredActivities, itemsPerPage: 15 });

  const fetchActivities = useCallback(async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setRefreshing(true);

      // Fetch check-ins/outs from agent_status_log
      let statusQuery = supabase
        .from('agent_status_log')
        .select(`
          id,
          agent_id,
          status,
          timestamp,
          location_lat,
          location_lng,
          selfie_url,
          agent_display_name
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (startISO) statusQuery = statusQuery.gte('timestamp', startISO);
      if (endISO) statusQuery = statusQuery.lte('timestamp', endISO);

      const { data: statusLogs, error: statusError } = await statusQuery;
      if (statusError) throw statusError;

      // Fetch sales from interactions
      let salesQuery = supabase
        .from('interactions')
        .select(`
          id,
          agent_id,
          timestamp,
          customer_name,
          sale_value,
          quantity_sold,
          latitude,
          longitude
        `)
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'sale')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (startISO) salesQuery = salesQuery.gte('timestamp', startISO);
      if (endISO) salesQuery = salesQuery.lte('timestamp', endISO);

      const { data: sales, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      // Fetch giveaways
      let giveawayQuery = supabase
        .from('giveaways')
        .select(`
          id,
          agent_id,
          recorded_at,
          recipient_name,
          total_items,
          location_lat,
          location_lng
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (startISO) giveawayQuery = giveawayQuery.gte('recorded_at', startISO);
      if (endISO) giveawayQuery = giveawayQuery.lte('recorded_at', endISO);

      const { data: giveaways, error: giveawayError } = await giveawayQuery;
      if (giveawayError) throw giveawayError;

      // Fetch surveys from interactions
      let surveyQuery = supabase
        .from('interactions')
        .select(`
          id,
          agent_id,
          timestamp,
          customer_name,
          latitude,
          longitude
        `)
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'survey')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (startISO) surveyQuery = surveyQuery.gte('timestamp', startISO);
      if (endISO) surveyQuery = surveyQuery.lte('timestamp', endISO);

      const { data: surveys, error: surveyError } = await surveyQuery;
      if (surveyError) throw surveyError;

      // Get agent names
      const agentIds = new Set([
        ...(statusLogs?.map(s => s.agent_id) || []),
        ...(sales?.map(s => s.agent_id) || []),
        ...(giveaways?.map(g => g.agent_id) || []),
        ...(surveys?.map(s => s.agent_id) || []),
      ]);

      const { data: agents } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', Array.from(agentIds));

      const agentMap = new Map(agents?.map(a => [
        a.user_id, 
        { 
          name: a.display_name || a.email?.split('@')[0] || 'Unknown',
          initials: (a.display_name || a.email || 'UN').substring(0, 2).toUpperCase()
        }
      ]));

      // Transform to ActivityItem
      const allActivities: ActivityItem[] = [];

      statusLogs?.forEach(log => {
        const agent = agentMap.get(log.agent_id) || { name: log.agent_display_name || 'Unknown', initials: 'UN' };
        let type: ActivityItem['type'] = 'check_in';
        if (log.status === 'checked_out') type = 'check_out';
        else if (log.status === 'lunch' || log.status === 'break') type = 'break_start';
        
        allActivities.push({
          id: log.id,
          type,
          agentName: agent.name,
          agentInitials: agent.initials,
          timestamp: log.timestamp,
          location: log.location_lat ? `${log.location_lat.toFixed(4)}, ${log.location_lng?.toFixed(4)}` : undefined,
          imageUrl: log.selfie_url || undefined,
        });
      });

      sales?.forEach(sale => {
        const agent = agentMap.get(sale.agent_id!) || { name: 'Unknown', initials: 'UN' };
        allActivities.push({
          id: sale.id,
          type: 'sale',
          agentName: agent.name,
          agentInitials: agent.initials,
          timestamp: sale.timestamp!,
          details: sale.customer_name ? `Sale to ${sale.customer_name}` : `${sale.quantity_sold} items sold`,
          value: sale.sale_value || undefined,
          location: sale.latitude ? `${sale.latitude.toFixed(4)}, ${sale.longitude?.toFixed(4)}` : undefined,
        });
      });

      giveaways?.forEach(giveaway => {
        const agent = agentMap.get(giveaway.agent_id) || { name: 'Unknown', initials: 'UN' };
        allActivities.push({
          id: giveaway.id,
          type: 'giveaway',
          agentName: agent.name,
          agentInitials: agent.initials,
          timestamp: giveaway.recorded_at,
          details: giveaway.recipient_name 
            ? `${giveaway.total_items} items to ${giveaway.recipient_name}` 
            : `${giveaway.total_items} items distributed`,
          location: giveaway.location_lat ? `${giveaway.location_lat.toFixed(4)}, ${giveaway.location_lng?.toFixed(4)}` : undefined,
        });
      });

      surveys?.forEach(survey => {
        const agent = agentMap.get(survey.agent_id!) || { name: 'Unknown', initials: 'UN' };
        allActivities.push({
          id: survey.id,
          type: 'survey',
          agentName: agent.name,
          agentInitials: agent.initials,
          timestamp: survey.timestamp!,
          details: survey.customer_name ? `Survey with ${survey.customer_name}` : 'Survey completed',
          location: survey.latitude ? `${survey.latitude.toFixed(4)}, ${survey.longitude?.toFixed(4)}` : undefined,
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(allActivities);
    } catch (error: any) {
      toast({
        title: "Error loading activities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWorkspaceId, startISO, endISO, toast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Real-time subscriptions
  const handleRealtimeUpdate = useCallback(() => {
    if (isRealtime && preset === 'today') {
      fetchActivities();
    }
  }, [fetchActivities, isRealtime, preset]);

  useRealtimeSubscription({
    table: 'agent_status_log',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleRealtimeUpdate,
    enabled: isRealtime && preset === 'today' && !!currentWorkspaceId,
  });

  useRealtimeSubscription({
    table: 'interactions',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleRealtimeUpdate,
    enabled: isRealtime && preset === 'today' && !!currentWorkspaceId,
  });

  useRealtimeSubscription({
    table: 'giveaways',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleRealtimeUpdate,
    enabled: isRealtime && preset === 'today' && !!currentWorkspaceId,
  });

  const filterButtons = [
    { key: 'all' as FilterType, label: 'All', icon: Activity },
    { key: 'check_in' as FilterType, label: 'Check-ins', icon: LogIn },
    { key: 'sale' as FilterType, label: 'Sales', icon: ShoppingCart },
    { key: 'giveaway' as FilterType, label: 'Giveaways', icon: Gift },
    { key: 'survey' as FilterType, label: 'Surveys', icon: ClipboardCheck },
  ];

  return (
    <SupervisorMobileLayout currentPage="live-feed">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Live Activity</h1>
            <p className="text-sm opacity-90">Real-time field updates</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsRealtime(!isRealtime)}
              className={`text-primary-foreground hover:bg-white/20 ${isRealtime ? 'bg-white/20' : ''}`}
            >
              <Wifi className={`h-5 w-5 ${isRealtime ? 'text-green-300' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchActivities}
              disabled={refreshing}
              className="text-primary-foreground hover:bg-white/20"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {activities.length} activities
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
            {dateLabel}
          </Badge>
          {isRealtime && preset === 'today' && (
            <Badge variant="secondary" className="bg-green-500/30 text-primary-foreground animate-pulse">
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Date range selector */}
      <div className="px-4 py-3 border-b">
        <DateRangeSelector
          preset={preset}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          dateRange={dateRange}
          dateLabel={dateLabel}
        />
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filterButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
              className="text-xs shrink-0"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity feed */}
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No activities found</p>
          </div>
        ) : (
          <>
            {paginatedItems.map(activity => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              onPrevPage={prevPage}
              onNextPage={nextPage}
              hasPrevPage={hasPrevPage}
              hasNextPage={hasNextPage}
            />
          </>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};
