import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, TrendingUp, ShoppingCart, Users, Calendar } from "lucide-react";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface SalesReport {
  agent_name: string;
  agent_email: string;
  total_sales: number;
  total_value: number;
  today_sales: number;
}

export const ReportsAnalytics = () => {
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalValue: 0,
    totalAgents: 0,
    avgSalesPerAgent: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
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

      // Fetch agents in Capwell workspace
      const { data: agents, error: agentsError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .eq('workspace_id', capwellWorkspace.id)
        .eq('role', 'agent')
        .eq('is_active', true);

      if (agentsError) throw agentsError;

      // Fetch sales data from sale_items
      const { data: allSales, error: salesError } = await supabase
        .from('sale_items')
        .select('quantity, total_price, created_at, sale_id')
        .eq('workspace_id', capwellWorkspace.id);

      if (salesError) throw salesError;

      // Get sales table to link to agents
      const { data: salesData, error: salesDataError } = await supabase
        .from('sales')
        .select('id, agent_id')
        .eq('workspace_id', capwellWorkspace.id);

      if (salesDataError) throw salesDataError;

      // Create a map of sale_id to agent_id
      const saleAgentMap = new Map(
        salesData?.map(sale => [sale.id, sale.agent_id]) || []
      );

      // Group sales by agent
      const agentSalesMap = new Map<string, { totalSales: number; totalValue: number; todaySales: number }>();

      allSales?.forEach(item => {
        const agentId = item.sale_id ? saleAgentMap.get(item.sale_id) : null;
        if (!agentId) return;

        const existing = agentSalesMap.get(agentId) || { totalSales: 0, totalValue: 0, todaySales: 0 };
        existing.totalSales += item.quantity;
        existing.totalValue += item.total_price || 0;
        
        if (item.created_at && item.created_at.startsWith(today)) {
          existing.todaySales += item.quantity;
        }

        agentSalesMap.set(agentId, existing);
      });

      // Build reports
      const reports: SalesReport[] = (agents || []).map(agent => {
        const sales = agentSalesMap.get(agent.user_id) || { totalSales: 0, totalValue: 0, todaySales: 0 };
        return {
          agent_name: agent.display_name || agent.email || 'Unknown',
          agent_email: agent.email || '',
          total_sales: sales.totalSales,
          total_value: sales.totalValue,
          today_sales: sales.todaySales,
        };
      }).sort((a, b) => b.total_sales - a.total_sales);

      setSalesReports(reports);

      // Calculate overall stats
      const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
      const totalValue = reports.reduce((sum, r) => sum + r.total_value, 0);
      const totalAgents = reports.length;
      const avgSalesPerAgent = totalAgents > 0 ? Math.round(totalSales / totalAgents) : 0;

      setStats({ totalSales, totalValue, totalAgents, avgSalesPerAgent });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load sales reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupervisorMobileLayout currentPage="more">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Sales Analytics</h1>
            <p className="text-sm opacity-90">Capwell workspace reports</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchReports} />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Total Sales</p>
              <p className="text-2xl font-bold text-primary">{stats.totalSales}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Total Value</p>
              <p className="text-2xl font-bold text-success">${stats.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Active Agents</p>
              <p className="text-2xl font-bold text-warning">{stats.totalAgents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Calendar className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">Avg/Agent</p>
              <p className="text-2xl font-bold text-accent-foreground">{stats.avgSalesPerAgent}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent Reports */}
      <div className="px-4 pb-20">
        <h2 className="text-lg font-semibold mb-3">Agent Performance</h2>
        <div className="space-y-3">
          {salesReports.map((report, index) => (
            <Card key={report.agent_email} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{report.agent_name}</p>
                    <p className="text-sm text-muted-foreground">{report.agent_email}</p>
                  </div>
                </div>
                {report.today_sales > 0 && (
                  <Badge variant="default">
                    {report.today_sales} today
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-lg font-semibold">{report.total_sales}</p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-lg font-semibold">${report.total_value.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}

          {salesReports.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No sales data available</p>
            </Card>
          )}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
