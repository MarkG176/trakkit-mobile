import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { LeaderboardCard } from "@/components/supervisor/LeaderboardCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, RefreshCw, Loader2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardEntry {
  id: string;
  name: string;
  initials: string;
  value: number;
  metric: string;
}

type Period = 'daily' | 'weekly' | 'monthly';
type MetricType = 'sales' | 'interactions' | 'giveaways';

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('daily');
  const [metricType, setMetricType] = useState<MetricType>('sales');
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, [currentWorkspaceId, period, metricType]);

  const getDateRange = (period: Period) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
    }
    
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const fetchLeaderboard = async () => {
    if (!currentWorkspaceId) return;

    try {
      setRefreshing(true);
      const { start, end } = getDateRange(period);

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

      const agentMap = new Map(agents?.map(a => [a.user_id, a]));
      const agentScores = new Map<string, number>();

      if (metricType === 'sales') {
        const { data: sales } = await supabase
          .from('daily_sales_tracking')
          .select('agent_id, quantity_sold')
          .eq('workspace_id', currentWorkspaceId)
          .gte('recorded_at', start)
          .lte('recorded_at', end);

        sales?.forEach(s => {
          const current = agentScores.get(s.agent_id) || 0;
          agentScores.set(s.agent_id, current + s.quantity_sold);
        });
      } else if (metricType === 'interactions') {
        const { data: interactions } = await supabase
          .from('interactions')
          .select('agent_id')
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', start)
          .lte('timestamp', end);

        interactions?.forEach(i => {
          if (i.agent_id) {
            const current = agentScores.get(i.agent_id) || 0;
            agentScores.set(i.agent_id, current + 1);
          }
        });
      } else if (metricType === 'giveaways') {
        const { data: giveaways } = await supabase
          .from('giveaways')
          .select('agent_id, total_items')
          .eq('workspace_id', currentWorkspaceId)
          .gte('recorded_at', start)
          .lte('recorded_at', end);

        giveaways?.forEach(g => {
          const current = agentScores.get(g.agent_id) || 0;
          agentScores.set(g.agent_id, current + g.total_items);
        });
      }

      const metricLabels = {
        sales: 'sales',
        interactions: 'interactions',
        giveaways: 'items given',
      };

      const leaderboardData = Array.from(agentScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([agentId, value]) => {
          const agent = agentMap.get(agentId);
          const name = agent?.display_name || agent?.email?.split('@')[0] || 'Unknown';
          return {
            id: agentId,
            name,
            initials: name.substring(0, 2).toUpperCase(),
            value,
            metric: metricLabels[metricType],
          };
        });

      setLeaderboard(leaderboardData);
    } catch (error: any) {
      toast({
        title: "Error loading leaderboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share && leaderboard.length > 0) {
      const top3 = leaderboard.slice(0, 3);
      const text = `🏆 Team Leaderboard (${period})\n\n${top3.map((a, i) => 
        `${i + 1}. ${a.name}: ${a.value} ${a.metric}`
      ).join('\n')}`;
      
      navigator.share({ title: 'Team Leaderboard', text });
    } else {
      toast({ title: "Sharing not supported on this device" });
    }
  };

  return (
    <SupervisorMobileLayout currentPage="leaderboard">
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm opacity-90">Top performing agents</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-white/20"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchLeaderboard}
              disabled={refreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Period tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Metric filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={metricType === 'sales' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetricType('sales')}
          >
            Sales
          </Button>
          <Button
            variant={metricType === 'interactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetricType('interactions')}
          >
            Interactions
          </Button>
          <Button
            variant={metricType === 'giveaways' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetricType('giveaways')}
          >
            Giveaways
          </Button>
        </div>

        {/* Leaderboard list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No data for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((agent, index) => (
              <LeaderboardCard
                key={agent.id}
                rank={index + 1}
                agent={agent}
              />
            ))}
          </div>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};
