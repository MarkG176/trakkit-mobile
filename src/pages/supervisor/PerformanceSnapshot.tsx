import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Trophy, Target, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  rank: string;
  points: number;
  sales: number;
  surveys: number;
  trend: "up" | "down" | "stable";
}

export const PerformanceSnapshot = () => {
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const { toast } = useToast();

  useEffect(() => {
    fetchAgentPerformance();
  }, [period]);

  const fetchAgentPerformance = async () => {
    try {
      // Fetch agent ranks
      const { data: ranks, error: ranksError } = await supabase
        .from("agent_ranks")
        .select("agent_id, total_points, current_rank, weekly_points, monthly_points")
        .order("total_points", { ascending: false });

      if (ranksError) throw ranksError;

      // Fetch agent details
      const agentIds = ranks?.map((r) => r.agent_id) || [];
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, display_name, email")
        .in("user_id", agentIds);

      // Fetch sales data
      const today = new Date().toISOString().split("T")[0];
      const { data: salesData } = await supabase
        .from("daily_sales_tracking")
        .select("agent_id, quantity_sold, total_value")
        .in("agent_id", agentIds)
        .eq("work_date", today);

      const agentPerformances: AgentPerformance[] = (ranks || []).map((rank) => {
        const user = userRoles?.find((u) => u.user_id === rank.agent_id);
        const sales = salesData?.filter((s) => s.agent_id === rank.agent_id);
        const totalSales = sales?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0;

        const points =
          period === "today"
            ? rank.total_points
            : period === "week"
            ? rank.weekly_points
            : rank.monthly_points;

        return {
          id: rank.agent_id,
          name: user?.display_name || user?.email || "Unknown",
          email: user?.email || "",
          rank: rank.current_rank || "rookie",
          points: points || 0,
          sales: totalSales,
          surveys: 0,
          trend: "stable" as const,
        };
      });

      setAgents(agentPerformances);
    } catch (error: any) {
      toast({
        title: "Error loading performance data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRankBadge = (rank: string) => {
    const colors: { [key: string]: string } = {
      legend: "bg-yellow-500 text-white",
      expert: "bg-purple-500 text-white",
      advanced: "bg-blue-500 text-white",
      intermediate: "bg-green-500 text-white",
      novice: "bg-gray-500 text-white",
      rookie: "bg-gray-400 text-white",
    };

    return (
      <Badge className={colors[rank] || "bg-gray-400 text-white"}>
        {rank.toUpperCase()}
      </Badge>
    );
  };

  return (
    <SupervisorMobileLayout currentPage="performance">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Agent Performance</h1>
            <p className="text-sm opacity-90">Track team achievements</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Trophy className="w-6 h-6" />
          </div>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/20">
            <TabsTrigger value="today" className="text-xs">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs">
              This Month
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Top performers for the selected period
          </p>
        </div>

        <div className="space-y-3">
          {agents.map((agent, index) => (
            <Card key={agent.id} className="p-4 relative overflow-hidden">
              {index < 3 && (
                <div className="absolute top-2 right-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                        ? "bg-gray-400 text-white"
                        : "bg-orange-600 text-white"
                    }`}
                  >
                    #{index + 1}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {agent.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                    {getRankBadge(agent.rank)}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-3">
                    {agent.email}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted rounded px-2 py-1">
                      <p className="text-xs text-muted-foreground">Points</p>
                      <p className="text-sm font-semibold">{agent.points}</p>
                    </div>
                    <div className="bg-muted rounded px-2 py-1">
                      <p className="text-xs text-muted-foreground">Sales</p>
                      <p className="text-sm font-semibold">{agent.sales}</p>
                    </div>
                    <div className="bg-muted rounded px-2 py-1">
                      <p className="text-xs text-muted-foreground">Surveys</p>
                      <p className="text-sm font-semibold">{agent.surveys}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {agents.length === 0 && (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No performance data available</p>
            </Card>
          )}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
