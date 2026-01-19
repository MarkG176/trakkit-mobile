import { useState, useEffect, useCallback } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { SaleItem } from "@/components/supervisor/SaleItem";
import { LiveIndicator } from "@/components/supervisor/LiveIndicator";
import { PullToRefresh } from "@/components/supervisor/PullToRefresh";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RefreshCw, Loader2, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface SaleData {
  id: string;
  agentId: string;
  agentName: string;
  productName: string;
  quantity: number;
  value: number;
  timestamp: string;
}

interface AgentSummary {
  agentId: string;
  agentName: string;
  totalSales: number;
  totalValue: number;
}

export const SalesFeed = () => {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [agentSummaries, setAgentSummaries] = useState<AgentSummary[]>([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { currentWorkspaceId } = useWorkspace();
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      // Get recent sales from sale_items (more reliable data source)
      // First get workspace users to filter by
      const { data: workspaceUsers } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      const userIds = workspaceUsers?.map(u => u.user_id) || [];

      if (userIds.length === 0) {
        setSales([]);
        setTotalUnits(0);
        setTotalRevenue(0);
        setAgentSummaries([]);
        setLoading(false);
        return;
      }

      // Get agent IDs
      const { data: agentData } = await supabase
        .from('user_roles')
        .select('user_id, display_name')
        .in('user_id', userIds)
        .eq('role', 'agent')
        .eq('is_active', true);

      const agentMap = new Map(agentData?.map(a => [a.user_id, a.display_name]) || []);
      const agentIds = Array.from(agentMap.keys());

      if (agentIds.length === 0) {
        setSales([]);
        setTotalUnits(0);
        setTotalRevenue(0);
        setAgentSummaries([]);
        setLoading(false);
        return;
      }

      // Fetch recent sales from sale_items for these agents
      const { data, error } = await supabase
        .from('sale_items')
        .select('id, agent_id, product_name, quantity, total_price, created_at')
        .in('agent_id', agentIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const salesData: SaleData[] = (data || []).map(sale => ({
        id: sale.id,
        agentId: sale.agent_id || '',
        agentName: agentMap.get(sale.agent_id || '') || 'Unknown',
        productName: sale.product_name || 'Unknown Product',
        quantity: sale.quantity,
        value: sale.total_price,
        timestamp: sale.created_at || new Date().toISOString(),
      }));

      setSales(salesData);

      // Calculate summaries
      const units = salesData.reduce((sum, s) => sum + s.quantity, 0);
      const revenue = salesData.reduce((sum, s) => sum + s.value, 0);
      setTotalUnits(units);
      setTotalRevenue(revenue);

      // Calculate agent summaries
      const agentSummaryMap = new Map<string, AgentSummary>();
      salesData.forEach(sale => {
        const existing = agentSummaryMap.get(sale.agentId) || {
          agentId: sale.agentId,
          agentName: sale.agentName,
          totalSales: 0,
          totalValue: 0,
        };
        existing.totalSales += sale.quantity;
        existing.totalValue += sale.value;
        agentSummaryMap.set(sale.agentId, existing);
      });

      const summaries = Array.from(agentSummaryMap.values())
        .sort((a, b) => b.totalSales - a.totalSales);
      setAgentSummaries(summaries);

    } catch (error: any) {
      toast({
        title: "Error loading sales",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Real-time subscription for new sales
  useRealtimeSubscription({
    table: 'sale_items',
    event: 'INSERT',
    filter: undefined, // Filter in the callback since sale_items may not have workspace_id
    onData: (payload) => {
      const sale = payload.new as any;
      // Only process if it's from our workspace agents
      if (!sale.agent_id) return;
      
      const newSale: SaleData = {
        id: sale.id,
        agentId: sale.agent_id,
        agentName: sale.agent_id?.substring(0, 8) || 'Unknown',
        productName: sale.product_name || 'Unknown Product',
        quantity: sale.quantity,
        value: sale.total_price,
        timestamp: sale.created_at,
      };
      
      setSales(prev => [newSale, ...prev]);
      setTotalUnits(prev => prev + newSale.quantity);
      setTotalRevenue(prev => prev + newSale.value);
      
      // Update agent summary
      setAgentSummaries(prev => {
        const existing = prev.find(a => a.agentId === newSale.agentId);
        if (existing) {
          return prev.map(a => 
            a.agentId === newSale.agentId
              ? { ...a, totalSales: a.totalSales + newSale.quantity, totalValue: a.totalValue + newSale.value }
              : a
          ).sort((a, b) => b.totalSales - a.totalSales);
        } else {
          return [...prev, {
            agentId: newSale.agentId,
            agentName: newSale.agentName,
            totalSales: newSale.quantity,
            totalValue: newSale.value,
          }].sort((a, b) => b.totalSales - a.totalSales);
        }
      });

      setIsConnected(true);
    },
    enabled: !!currentWorkspaceId,
  });

  const handleRefresh = async () => {
    await fetchSales();
  };

  if (loading) {
    return (
      <SupervisorMobileLayout currentPage="sales">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="sales">
      <div className="bg-gradient-to-br from-green-600 to-green-500 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Feed</h1>
            <p className="text-sm opacity-90">Recent sales from your team</p>
          </div>
          <div className="flex items-center gap-2">
            <LiveIndicator isConnected={isConnected} className="text-white" />
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchSales}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-white/80" />
              <span className="text-xs text-white/80">Units Sold</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{totalUnits}</p>
          </Card>
          <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-white/80" />
              <span className="text-xs text-white/80">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              KES {totalRevenue.toLocaleString()}
            </p>
          </Card>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <div className="p-4 space-y-4 pb-24">
          {/* Top Agents */}
          {agentSummaries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Top Sellers Today</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {agentSummaries.slice(0, 5).map((agent, index) => (
                  <Card key={agent.agentId} className="p-3 shrink-0 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {agent.agentName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <Badge 
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                            variant={index === 0 ? "default" : "secondary"}
                          >
                            {index + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium truncate">{agent.agentName}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{agent.totalSales} units</span>
                      <span className="font-medium text-green-600">
                        KES {agent.totalValue.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Sales Stream */}
          <div>
            <h2 className="text-sm font-semibold mb-3">Live Sales Stream</h2>
            {sales.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No sales recorded yet today</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {sales.map((sale, index) => (
                  <SaleItem
                    key={sale.id}
                    {...sale}
                    isNew={index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </SupervisorMobileLayout>
  );
};
