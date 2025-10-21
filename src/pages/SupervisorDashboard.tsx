import { useEffect, useState } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Package, MapPin, Clock, Trophy, Calendar, AlertTriangle, Loader2, RefreshCw, UserPlus } from "lucide-react";
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
    pendingApprovals: 0,
  });
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Get Capwell workspace ID
      const { data: capwellWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', 'Capwell')
        .single();

      if (workspaceError) throw workspaceError;
      const capwellWorkspaceId = capwellWorkspace.id;

      // Fetch total agents in Capwell workspace
      const { data: workspaceAgents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email, role')
        .eq('workspace_id', capwellWorkspaceId)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      // Fetch agent status logs for today
      const agentIds = workspaceAgents?.map(agent => agent.user_id) || [];
      const { data: statusLogs, error: statusError } = await supabase
        .from('agent_status_log')
        .select('agent_id, status, timestamp, location_lat, location_lng')
        .in('agent_id', agentIds)
        .gte('timestamp', `${today}T00:00:00`)
        .order('timestamp', { ascending: false });

      if (statusError) throw statusError;

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
        .in('agent_id', agentIds)
        .order('updated_at', { ascending: false });

      if (batteryError) throw batteryError;

      // Get latest battery status for each agent
      const batteryStatusMap = new Map();
      batteryStatus?.forEach(battery => {
        if (!batteryStatusMap.has(battery.agent_id)) {
          batteryStatusMap.set(battery.agent_id, battery);
        }
      });

      // Fetch today's sales from sale_items table with Capwell workspace
      const { data: saleItems, error: salesError } = await supabase
        .from('sale_items')
        .select('quantity, created_at')
        .eq('workspace_id', capwellWorkspaceId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (salesError) throw salesError;

      // Fetch pending day plans
      const { data: pendingPlans, error: plansError } = await supabase
        .from('day_plans')
        .select('id')
        .eq('workspace_id', capwellWorkspaceId)
        .eq('status', 'pending');

      if (plansError) throw plansError;

      // Calculate stats
      const totalAgents = workspaceAgents?.length || 0;
      const activeAgents = Array.from(agentStatusMap.values())
        .filter(log => log.status === 'checked_in').length;
      const todaySales = saleItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const pendingApprovals = pendingPlans?.length || 0;

      setStats({
        totalAgents,
        activeAgents,
        todaySales,
        pendingApprovals,
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
            sales: 0,
            surveys: 0,
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

        <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/supervisor/daily-plan-approval')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Calendar className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Pending Plans</p>
              <p className="text-2xl font-bold text-destructive">{stats.pendingApprovals}</p>
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