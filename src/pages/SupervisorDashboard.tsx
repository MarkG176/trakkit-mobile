import { useEffect, useState } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Package, MapPin, Clock, Trophy, DollarSign, Calendar, AlertTriangle, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { InviteAgentDialog } from "@/components/InviteAgentDialog";

interface AgentStatus {
  id: string;
  name: string;
  email: string;
  status: string;
  location: { lat: number; lng: number } | null;
  lastUpdate: string;
  batteryLevel: number;
  todayStats: {
    sales: number;
    surveys: number;
  };
}

export const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { displayName } = useUserProfile();
  const { toast } = useToast();
  const { currentWorkspaceId } = useWorkspace();
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    todaySales: 0,
    todaySalesValue: 0,
  });
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchDashboardStats();
    }
  }, [currentWorkspaceId]);

  const fetchDashboardStats = async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      // 1. Total Agents: Count from user_workspaces where role = 'agent' and is_active = true
      const { data: agentWorkspaces, error: agentWorkspacesError } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentWorkspacesError) throw agentWorkspacesError;

      const totalAgents = agentWorkspaces?.length || 0;
      const agentUserIds = agentWorkspaces?.map(a => a.user_id) || [];

      // 2. Active Today: Count distinct agents who appear in agent_status_log today
      const { data: todayStatusLogs, error: statusError } = await supabase
        .from('agent_status_log')
        .select('agent_id')
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', todayStart)
        .lte('timestamp', todayEnd);

      if (statusError) throw statusError;

      // Get unique agent IDs who logged activity today
      const uniqueActiveAgents = new Set(todayStatusLogs?.map(log => log.agent_id) || []);
      const activeAgents = uniqueActiveAgents.size;

      // 3. Today's Sales: Count of sale_items today
      const { data: saleItemsCount, error: salesCountError } = await supabase
        .from('sale_items')
        .select('id', { count: 'exact' })
        .eq('workspace_id', currentWorkspaceId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .eq('is_deleted', false);

      if (salesCountError) throw salesCountError;

      const todaySales = saleItemsCount?.length || 0;

      // 4. Today's Sales Value: Sum of total_price from sale_items today
      const { data: saleItemsValue, error: salesValueError } = await supabase
        .from('sale_items')
        .select('total_price')
        .eq('workspace_id', currentWorkspaceId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .eq('is_deleted', false);

      if (salesValueError) throw salesValueError;

      const todaySalesValue = saleItemsValue?.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0) || 0;

      if (agentUserIds.length === 0) {
        setStats({
          totalAgents,
          activeAgents,
          todaySales,
          todaySalesValue,
        });
        setAgentStatuses([]);
        return;
      }

      // Fetch agent sales today for quick stats
      const { data: saleItemsByAgent, error: saleItemsByAgentError } = await supabase
        .from('sale_items')
        .select('agent_id, quantity')
        .eq('workspace_id', currentWorkspaceId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .eq('is_deleted', false)
        .in('agent_id', agentUserIds);

      if (saleItemsByAgentError) throw saleItemsByAgentError;

      const salesByAgent = new Map<string, number>();
      saleItemsByAgent?.forEach(item => {
        if (!item.agent_id) return;
        const current = salesByAgent.get(item.agent_id) || 0;
        salesByAgent.set(item.agent_id, current + (item.quantity || 0));
      });

      // Fetch agent surveys today
      const { data: surveyInteractions, error: surveyError } = await supabase
        .from('interactions')
        .select('agent_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'survey')
        .gte('timestamp', todayStart)
        .lte('timestamp', todayEnd)
        .in('agent_id', agentUserIds);

      if (surveyError) throw surveyError;

      const surveysByAgent = new Map<string, number>();
      surveyInteractions?.forEach(item => {
        if (!item.agent_id) return;
        const current = surveysByAgent.get(item.agent_id) || 0;
        surveysByAgent.set(item.agent_id, current + 1);
      });

      // Fetch agent details for display (from user_roles for those in workspace)
      const { data: workspaceAgents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email, role')
        .in('user_id', agentUserIds)
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      // Fetch status logs for agent display
      const { data: statusLogs, error: statusLogsError } = await supabase
        .from('agent_status_log')
        .select('agent_id, status, timestamp, location_lat, location_lng')
        .in('agent_id', agentUserIds)
        .gte('timestamp', todayStart)
        .order('timestamp', { ascending: false });

      if (statusLogsError) throw statusLogsError;

      // Get latest status for each agent
      const agentStatusMap = new Map();
      statusLogs?.forEach(log => {
        if (!agentStatusMap.has(log.agent_id)) {
          agentStatusMap.set(log.agent_id, log);
        }
      });

      // Fetch battery status
      const { data: batteryStatus, error: batteryError } = await supabase
        .from('agent_battery_status')
        .select('agent_id, battery_level, location_lat, location_lng')
        .in('agent_id', agentUserIds)
        .order('updated_at', { ascending: false });

      if (batteryError) throw batteryError;

      // Get latest battery status for each agent
      const batteryStatusMap = new Map();
      batteryStatus?.forEach(battery => {
        if (!batteryStatusMap.has(battery.agent_id)) {
          batteryStatusMap.set(battery.agent_id, battery);
        }
      });

      setStats({
        totalAgents,
        activeAgents,
        todaySales,
        todaySalesValue,
      });

      // Build agent statuses for display
      const agentStatuses: AgentStatus[] = workspaceAgents?.map(agent => {
        const statusLog = agentStatusMap.get(agent.user_id);
        const batteryData = batteryStatusMap.get(agent.user_id);
        
        // Use location from status log first, then from battery status
        let location = null;
        if (statusLog?.location_lat && statusLog?.location_lng) {
          location = { lat: statusLog.location_lat, lng: statusLog.location_lng };
        } else if (batteryData?.location_lat && batteryData?.location_lng) {
          location = { lat: batteryData.location_lat, lng: batteryData.location_lng };
        }
        
        return {
          id: agent.user_id,
          name: agent.display_name || agent.email || 'Unknown Agent',
          email: agent.email || '',
          status: statusLog?.status || 'unknown',
          location,
          lastUpdate: statusLog?.timestamp ? new Date(statusLog.timestamp).toLocaleTimeString() : 'Never',
          batteryLevel: batteryData?.battery_level || 0,
          todayStats: {
            sales: salesByAgent.get(agent.user_id) || 0,
            surveys: surveysByAgent.get(agent.user_id) || 0,
          },
        };
      }) || [];

      setAgentStatuses(agentStatuses);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Hello, {displayName}!</h1>
            <p className="text-sm opacity-90">Team overview and management</p>
          </div>
          <button 
            onClick={() => setShowInviteDialog(true)}
            className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
          >
            <UserPlus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <WorkspaceSwitcher 
            onWorkspaceChange={() => fetchDashboardStats()}
            className="text-primary-foreground"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchDashboardStats()}
            disabled={loading}
            className="text-primary-foreground hover:bg-white/20"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/supervisor/agent-tracking')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Total Agents</p>
              <p className="text-2xl font-bold text-primary">{stats.totalAgents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/supervisor/agent-tracking')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Active Today</p>
              <p className="text-2xl font-bold text-success">{stats.activeAgents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Today's Sales</p>
              <p className="text-2xl font-bold text-warning">{stats.todaySales}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Sales Value</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.todaySalesValue.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Status */}
      <div className="px-4 pb-4">
        <h2 className="text-h3 mb-3">Agent Status</h2>
        <div className="space-y-3">
          {agentStatuses.length > 0 ? (
            agentStatuses.slice(0, 4).map((agent) => (
              <Card key={agent.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-secondary-foreground" />
                        <span className="text-sm text-secondary-foreground">
                          {agent.location ? `${agent.location.lat.toFixed(2)}, ${agent.location.lng.toFixed(2)}` : 'No location'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      agent.status === 'checked_in' ? 'default' : 
                      agent.status === 'lunch' ? 'secondary' : 
                      'destructive'
                    }>
                      {agent.status === 'checked_in' ? 'Active' : 
                       agent.status === 'lunch' ? 'On Break' : 
                       agent.status === 'checked_out' ? 'Offline' : 'Unknown'}
                    </Badge>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={10} className="text-secondary-foreground" />
                      <span className="text-xs text-secondary-foreground">{agent.lastUpdate}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-secondary-foreground">
                        {agent.todayStats.sales} sales
                      </span>
                      {agent.batteryLevel > 0 && (
                        <span className="text-xs text-secondary-foreground">
                          • {agent.batteryLevel}% battery
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4">
              <div className="text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No agents found in current workspace</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-20">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/supervisor/agent-tracking')}
          >
            <Users size={20} />
            <span className="text-sm">Agent Tracking</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/supervisor/daily-plan-approval')}
          >
            <Calendar size={20} />
            <span className="text-sm">Approve Plans</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2"
            onClick={() => navigate('/supervisor/inventory-management')}
          >
            <Package size={20} />
            <span className="text-sm">Inventory</span>
          </Button>
        </div>
      </div>

      <InviteAgentDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog}
      />
    </SupervisorMobileLayout>
  );
};