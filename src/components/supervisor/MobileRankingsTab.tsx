// [CMP-255781] MobileRankingsTab — mobile rankings tab component
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProjectCurrency } from "@/hooks/useProjectCurrency";

interface AgentRanking {
  agent_id: string;
  agent_name: string;
  total_sales_value: number;
  total_units_sold: number;
  sales_count: number;
}

interface MobileRankingsTabProps {
  workspaceId: string | undefined;
}

export function MobileRankingsTab({ workspaceId }: MobileRankingsTabProps) {
  const { format: formatCurrency } = useProjectCurrency();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rankings
  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['mobile-rankings', workspaceId],
    queryFn: async (): Promise<AgentRanking[]> => {
      const { data, error } = await supabase
        .from("daily_sales_tracking")
        .select("agent_id, agent_name, quantity_sold, total_value")
        .eq("workspace_id", workspaceId!);
      
      if (error) throw error;
      if (!data || data.length === 0) return [];
      
      // Aggregate by agent_id
      const agentSalesMap = new Map<string, Omit<AgentRanking, 'agent_id'>>();
      
      data.forEach((sale) => {
        if (!sale.agent_id) return;
        
        const current = agentSalesMap.get(sale.agent_id) || {
          agent_name: sale.agent_name || "Unknown",
          total_sales_value: 0,
          total_units_sold: 0,
          sales_count: 0
        };
        
        current.total_sales_value += sale.total_value || 0;
        current.total_units_sold += sale.quantity_sold || 0;
        current.sales_count += 1;
        if (sale.agent_name && current.agent_name === "Unknown") {
          current.agent_name = sale.agent_name;
        }
        
        agentSalesMap.set(sale.agent_id, current);
      });
      
      return Array.from(agentSalesMap.entries())
        .map(([agent_id, data]) => ({
          agent_id,
          ...data
        }))
        .sort((a, b) => b.total_sales_value - a.total_sales_value);
    },
    enabled: !!workspaceId,
  });

  const filteredRankings = rankings.filter(agent =>
    agent.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankBadge = (index: number) => {
    if (index === 0) return { color: "bg-yellow-500", icon: "🥇" };
    if (index === 1) return { color: "bg-gray-400", icon: "🥈" };
    if (index === 2) return { color: "bg-amber-600", icon: "🥉" };
    return { color: "bg-muted", icon: null };
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Search Header */}
      <div className="p-4 border-b bg-background sticky top-0 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredRankings.length} agents ranked
        </p>
      </div>

      {/* Rankings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No agents found</p>
          </div>
        ) : (
          filteredRankings.map((agent, index) => {
            const badge = getRankBadge(index);
            return (
              <Card key={agent.agent_id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${badge.color} ${index < 3 ? 'text-white' : 'text-foreground'}`}>
                      {badge.icon || index + 1}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.agent_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agent.total_units_sold} units
                        <span className="mx-1">•</span>
                        {agent.sales_count} sales
                      </p>
                    </div>

                    {/* Sales Value */}
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(agent.total_sales_value)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
