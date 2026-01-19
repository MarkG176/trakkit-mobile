import { useEffect, useState, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { LiveKPICard } from "@/components/supervisor/LiveKPICard";
import { LiveIndicator } from "@/components/supervisor/LiveIndicator";
import { AgentStatusItem, AgentStatusItemProps } from "@/components/supervisor/AgentStatusItem";
import { PullToRefresh } from "@/components/supervisor/PullToRefresh";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Store, Briefcase, Calendar, Package, RefreshCw, UserPlus, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { InviteAgentDialog } from "@/components/InviteAgentDialog";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { formatDistanceToNow } from "date-fns";

interface KPIData {
  agentsOnline: number;
  totalAgents: number;
  salesCount: number;
  salesValue: number;
  storesVisited: number;
  activeProjects: number;
}

export const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { displayName } = useUserProfile();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  
  const [kpis, setKpis] = useState<KPIData>({
    agentsOnline: 0,
    totalAgents: 0,
    salesCount: 0,
    salesValue: 0,
    storesVisited: 0,
    activeProjects: 0,
  });
  const [recentActivity, setRecentActivity] = useState<AgentStatusItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    return { todayStart, todayEnd: todayEnd.toISOString(), todayDate: today.toISOString().split('T')[0] };
  };

  const fetchDashboardData = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      setLoading(true);
      const { todayStart, todayEnd } = getTodayRange();

      // First get workspace users
      const { data: workspaceUsers } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      const userIds = workspaceUsers?.map(u => u.user_id) || [];

      // Get agents (those with role='agent' in user_roles)
      const { data: agentData } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('user_id', userIds.length > 0 ? userIds : ['no-match'])
        .eq('role', 'agent')
        .eq('is_active', true);

      const totalAgents = agentData?.length || 0;

      // Parallel fetch remaining data
      const [
        statusResult,
        salesResult,
        storesResult,
        projectsResult,
        activityResult,
      ] = await Promise.all([
        // Agents with activity today
        supabase
          .from('agent_status_log')
          .select('agent_id')
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', todayStart)
          .lte('timestamp', todayEnd),
        
        // Sales today from sale_items (include null workspace_id or matching)
        supabase
          .from('sale_items')
          .select('id, total_price, agent_id')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .eq('is_deleted', false),
        
        // Stores visited
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
        
        // Recent activity - show recent regardless of today for demo purposes
        supabase
          .from('agent_status_log')
          .select('id, agent_id, agent_display_name, status, timestamp, location_lat, location_lng, selfie_url, distance_from_assigned, in_range')
          .eq('workspace_id', currentWorkspaceId)
          .order('timestamp', { ascending: false })
          .limit(5),
      ]);

      // Filter sales by agents in this workspace
      const agentIdSet = new Set(agentData?.map(a => a.user_id) || []);
      const workspaceSales = (salesResult.data || []).filter(s => 
        s.agent_id && agentIdSet.has(s.agent_id)
      );

      // Process KPIs
      const uniqueActiveAgents = new Set(statusResult.data?.map(s => s.agent_id) || []);
      const agentsOnline = uniqueActiveAgents.size;
      const salesCount = workspaceSales.length;
      const salesValue = workspaceSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
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

      // Process activity
      const activity: AgentStatusItemProps[] = (activityResult.data || []).map(log => ({
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
      setRecentActivity(activity);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time subscriptions
  const handleStatusUpdate = useCallback((payload: any) => {
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

    setRecentActivity(prev => [newActivity, ...prev].slice(0, 5));
    
    if (log.status === 'checked_in') {
      setKpis(prev => ({ ...prev, agentsOnline: prev.agentsOnline + 1 }));
    } else if (log.status === 'checked_out') {
      setKpis(prev => ({ ...prev, agentsOnline: Math.max(0, prev.agentsOnline - 1) }));
    }
    
    setLastUpdated(new Date());
    setIsConnected(true);
  }, []);

  const handleSaleUpdate = useCallback((payload: any) => {
    const sale = payload.new;
    setKpis(prev => ({
      ...prev,
      salesCount: prev.salesCount + 1,
      salesValue: prev.salesValue + (Number(sale.total_price) || 0),
    }));
    setLastUpdated(new Date());
    setIsConnected(true);
  }, []);

  useRealtimeSubscription({
    table: 'agent_status_log',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleStatusUpdate,
    enabled: !!currentWorkspaceId,
  });

  useRealtimeSubscription({
    table: 'sale_items',
    event: 'INSERT',
    filter: currentWorkspaceId ? `workspace_id=eq.${currentWorkspaceId}` : undefined,
    onData: handleSaleUpdate,
    enabled: !!currentWorkspaceId,
  });

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <SupervisorMobileLayout currentPage="dashboard">
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="dashboard">
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hello, {displayName}!</h1>
              <p className="text-sm opacity-90">Team overview</p>
            </div>
            <div className="flex items-center gap-2">
              <LiveIndicator isConnected={isConnected} className="text-primary-foreground" />
              <button 
                onClick={() => setShowInviteDialog(true)}
                className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <WorkspaceSwitcher 
              onWorkspaceChange={() => fetchDashboardData()}
              className="text-primary-foreground"
            />
            <div className="text-xs opacity-75">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Live KPIs Grid */}
        <div className="p-4 -mt-4">
          <div className="grid grid-cols-2 gap-3">
            <LiveKPICard
              title="Agents Online"
              value={kpis.agentsOnline}
              subtitle={`of ${kpis.totalAgents} total`}
              icon={Users}
              color="success"
              onClick={() => navigate('/supervisor/agent-tracking')}
              isLive
            />
            <LiveKPICard
              title="Today's Sales"
              value={kpis.salesCount}
              subtitle="transactions"
              icon={TrendingUp}
              color="primary"
              onClick={() => navigate('/supervisor/sales-feed')}
              isLive
            />
            <LiveKPICard
              title="Revenue"
              value={`KES ${kpis.salesValue.toLocaleString()}`}
              icon={DollarSign}
              color="success"
              onClick={() => navigate('/supervisor/sales-feed')}
            />
            <LiveKPICard
              title="Stores Visited"
              value={kpis.storesVisited}
              icon={Store}
              color="warning"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3">Recent Activity</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary"
              onClick={() => navigate('/supervisor/live-feed')}
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <AgentStatusItem key={activity.id} {...activity} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No activity yet today</p>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-24">
          <h2 className="text-h3 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 p-2"
              onClick={() => navigate('/supervisor/agent-tracking')}
            >
              <Users size={20} className="text-primary" />
              <span className="text-xs text-center">Agents</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 p-2"
              onClick={() => navigate('/supervisor/daily-plan-approval')}
            >
              <Calendar size={20} className="text-primary" />
              <span className="text-xs text-center">Plans</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2 p-2"
              onClick={() => navigate('/supervisor/inventory-management')}
            >
              <Package size={20} className="text-primary" />
              <span className="text-xs text-center">Inventory</span>
            </Button>
          </div>
        </div>
      </PullToRefresh>

      <InviteAgentDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog}
      />
    </SupervisorMobileLayout>
  );
};
