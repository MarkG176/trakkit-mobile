import { useState, useEffect, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { AgentStatusItem, AgentStatusItemProps } from "@/components/supervisor/AgentStatusItem";
import { LiveIndicator } from "@/components/supervisor/LiveIndicator";
import { PullToRefresh } from "@/components/supervisor/PullToRefresh";
import { DateRangeSelector } from "@/components/supervisor/DateRangeSelector";
import { PaginationControls } from "@/components/supervisor/PaginationControls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RefreshCw, Loader2, Activity, LogIn, LogOut, Coffee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

type FilterType = 'all' | 'checked_in' | 'checked_out' | 'break';

export const LiveFeed = () => {
  const [activities, setActivities] = useState<AgentStatusItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isConnected, setIsConnected] = useState(false);
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  
  const { preset, setPreset, setCustomRange, dateRange, startISO, endISO, dateLabel } = useDateRangeFilter('today');

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'break') return activity.status === 'lunch' || activity.status === 'break';
    return activity.status === filter;
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
  } = usePagination({ items: filteredActivities, itemsPerPage: 20 });

  const fetchActivities = useCallback(async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setRefreshing(true);

      let query = supabase
        .from('agent_status_log')
        .select(`
          id,
          agent_id,
          agent_display_name,
          status,
          timestamp,
          location_lat,
          location_lng,
          selfie_url,
          distance_from_assigned,
          in_range
        `)
        .eq('workspace_id', currentWorkspaceId)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (startISO) query = query.gte('timestamp', startISO);
      if (endISO) query = query.lte('timestamp', endISO);

      const { data, error } = await query;
      if (error) throw error;

      const activityData: AgentStatusItemProps[] = (data || []).map(log => ({
        id: log.id,
        agentName: log.agent_display_name || 'Unknown Agent',
        agentInitials: (log.agent_display_name || 'UA').substring(0, 2).toUpperCase(),
        status: log.status as AgentStatusItemProps['status'],
        timestamp: log.timestamp,
        locationLat: log.location_lat ?? undefined,
        locationLng: log.location_lng ?? undefined,
        selfieUrl: log.selfie_url ?? undefined,
        distanceFromAssigned: log.distance_from_assigned ?? undefined,
        inRange: log.in_range ?? undefined,
      }));

      setActivities(activityData);
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

  // Real-time subscription
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (preset !== 'today') return;
    
    const log = payload.new;
    const newActivity: AgentStatusItemProps = {
      id: log.id,
      agentName: log.agent_display_name || 'Unknown Agent',
      agentInitials: (log.agent_display_name || 'UA').substring(0, 2).toUpperCase(),
      status: log.status,
      timestamp: log.timestamp,
      locationLat: log.location_lat,
      locationLng: log.location_lng,
      selfieUrl: log.selfie_url,
      distanceFromAssigned: log.distance_from_assigned,
      inRange: log.in_range,
      isNew: true,
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 200));
    setIsConnected(true);
  }, [preset]);

  useRealtimeSubscription({
    table: 'agent_status_log',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleRealtimeUpdate,
    enabled: preset === 'today' && !!currentWorkspaceId,
  });

  const handleRefresh = async () => {
    await fetchActivities();
  };

  const filterButtons = [
    { key: 'all' as FilterType, label: 'All', icon: Activity },
    { key: 'checked_in' as FilterType, label: 'Check-ins', icon: LogIn },
    { key: 'checked_out' as FilterType, label: 'Check-outs', icon: LogOut },
    { key: 'break' as FilterType, label: 'Breaks', icon: Coffee },
  ];

  // Count by status
  const statusCounts = {
    all: activities.length,
    checked_in: activities.filter(a => a.status === 'checked_in').length,
    checked_out: activities.filter(a => a.status === 'checked_out').length,
    break: activities.filter(a => a.status === 'lunch' || a.status === 'break').length,
  };

  return (
    <SupervisorMobileLayout currentPage="live-feed">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Activity Feed</h1>
            <p className="text-sm opacity-90">Real-time agent updates</p>
          </div>
          <div className="flex gap-2 items-center">
            <LiveIndicator isConnected={isConnected && preset === 'today'} className="text-primary-foreground" />
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
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
            {activities.length} events
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
            {dateLabel}
          </Badge>
          {isConnected && preset === 'today' && (
            <Badge variant="secondary" className="bg-green-500/30 text-primary-foreground border-0 animate-pulse">
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Date range selector */}
      <div className="px-4 py-3 border-b bg-background">
        <DateRangeSelector
          preset={preset}
          setPreset={setPreset}
          setCustomRange={setCustomRange}
          dateRange={dateRange}
          dateLabel={dateLabel}
        />
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 border-b bg-background overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filterButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
              className="text-xs shrink-0 gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <Badge 
                variant="secondary" 
                className={`ml-1 h-5 px-1.5 text-[10px] ${filter === key ? 'bg-primary-foreground/20' : 'bg-muted'}`}
              >
                {statusCounts[key]}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 space-y-2 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : paginatedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No activities found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filter !== 'all' ? 'Try changing the filter' : 'Activity will appear here as agents check in'}
              </p>
            </Card>
          ) : (
            <>
              {paginatedItems.map((activity) => (
                <AgentStatusItem key={activity.id} {...activity} />
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
      </PullToRefresh>
    </SupervisorMobileLayout>
  );
};
