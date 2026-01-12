import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { QuickStatCard } from "@/components/supervisor/QuickStatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, ShoppingCart, Gift, ClipboardCheck, 
  RefreshCw, Loader2, Battery, AlertTriangle,
  TrendingUp, Target, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  activeAgents: number;
  totalAgents: number;
  salesCount: number;
  salesValue: number;
  giveawaysCount: number;
  surveysCount: number;
  salesTarget: number;
  lowBatteryAgents: number;
  notCheckedIn: number;
}

interface TopPerformer {
  id: string;
  name: string;
  initials: string;
  sales: number;
}

export const QuickStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalAgents: 0,
    salesCount: 0,
    salesValue: 0,
    giveawaysCount: 0,
    surveysCount: 0,
    salesTarget: 100,
    lowBatteryAgents: 0,
    notCheckedIn: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [currentWorkspaceId]);

  const fetchStats = async () => {
    if (!currentWorkspaceId) return;

    try {
      setRefreshing(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const todayDate = today.toISOString().split('T')[0];

      // Get workspace agents
      const { data: workspaceUsers } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      const userIds = workspaceUsers?.map(u => u.user_id) || [];

      const { data: agents } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', userIds)
        .eq('role', 'agent')
        .eq('is_active', true);

      const agentIds = agents?.map(a => a.user_id) || [];
      const totalAgents = agentIds.length;

      // Get active agents (checked in today)
      const { data: statusLogs } = await supabase
        .from('agent_status_log')
        .select('agent_id, status')
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', todayISO)
        .in('status', ['checked_in', 'lunch']);

      const activeAgentIds = new Set(statusLogs?.map(s => s.agent_id) || []);
      const activeAgents = activeAgentIds.size;
      const notCheckedIn = totalAgents - activeAgents;

      // Get sales stats
      const { data: sales } = await supabase
        .from('daily_sales_tracking')
        .select('agent_id, quantity_sold, total_value')
        .eq('workspace_id', currentWorkspaceId)
        .eq('work_date', todayDate);

      const salesCount = sales?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
      const salesValue = sales?.reduce((sum, s) => sum + s.total_value, 0) || 0;

      // Get giveaways count
      const { count: giveawaysCount } = await supabase
        .from('giveaways')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspaceId)
        .gte('recorded_at', todayISO);

      // Get surveys count
      const { count: surveysCount } = await supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', currentWorkspaceId)
        .eq('interaction_type', 'survey')
        .gte('timestamp', todayISO);

      // Get low battery agents
      const { data: batteryData } = await supabase
        .from('agent_battery_status')
        .select('agent_id, battery_level')
        .eq('workspace_id', currentWorkspaceId)
        .in('agent_id', agentIds)
        .lt('battery_level', 20);

      const lowBatteryAgents = batteryData?.length || 0;

      // Get top performers
      const agentSalesMap = new Map<string, number>();
      sales?.forEach(s => {
        const current = agentSalesMap.get(s.agent_id) || 0;
        agentSalesMap.set(s.agent_id, current + s.quantity_sold);
      });

      const topPerformerData = Array.from(agentSalesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([agentId, salesCount]) => {
          const agent = agents?.find(a => a.user_id === agentId);
          const name = agent?.display_name || agent?.email?.split('@')[0] || 'Unknown';
          return {
            id: agentId,
            name,
            initials: name.substring(0, 2).toUpperCase(),
            sales: salesCount,
          };
        });

      setStats({
        activeAgents,
        totalAgents,
        salesCount,
        salesValue,
        giveawaysCount: giveawaysCount || 0,
        surveysCount: surveysCount || 0,
        salesTarget: 100,
        lowBatteryAgents,
        notCheckedIn,
      });
      setTopPerformers(topPerformerData);
    } catch (error: any) {
      toast({
        title: "Error loading stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SupervisorMobileLayout currentPage="quick-stats">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="quick-stats">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Quick Stats</h1>
            <p className="text-sm opacity-90">Today's performance overview</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchStats}
            disabled={refreshing}
            className="text-primary-foreground hover:bg-white/20"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStatCard
            title="Active Agents"
            value={stats.activeAgents}
            target={stats.totalAgents}
            icon={Users}
            color="success"
          />
          <QuickStatCard
            title="Sales Today"
            value={stats.salesCount}
            target={stats.salesTarget}
            icon={ShoppingCart}
            trend="up"
            trendValue="+12%"
            color="primary"
          />
          <QuickStatCard
            title="Giveaways"
            value={stats.giveawaysCount}
            icon={Gift}
            color="warning"
          />
          <QuickStatCard
            title="Surveys"
            value={stats.surveysCount}
            icon={ClipboardCheck}
            color="primary"
          />
        </div>

        {/* Sales value card */}
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Sales Value</p>
              <p className="text-3xl font-bold text-primary">
                KES {stats.salesValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Alerts section */}
        {(stats.lowBatteryAgents > 0 || stats.notCheckedIn > 0) && (
          <Card className="p-4 border-yellow-200 bg-yellow-50">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Alerts
            </h3>
            <div className="space-y-2">
              {stats.lowBatteryAgents > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-red-500" />
                    <span>Low battery agents</span>
                  </div>
                  <Badge variant="destructive">{stats.lowBatteryAgents}</Badge>
                </div>
              )}
              {stats.notCheckedIn > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span>Not checked in</span>
                  </div>
                  <Badge variant="secondary">{stats.notCheckedIn}</Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Top performers */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Top Performers Today
          </h3>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sales recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {performer.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{performer.name}</p>
                  </div>
                  <Badge variant="secondary">{performer.sales} sales</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </SupervisorMobileLayout>
  );
};
