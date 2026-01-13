import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Target, Users, TrendingUp, Package, 
  Calendar, DollarSign, MapPin, Clock, Download, FileText, FileSpreadsheet
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ProjectExportData, 
  generateCSV, 
  generateTXT, 
  downloadFile 
} from "@/utils/projectExport";

interface ProjectDetails {
  id: string;
  project_name: string;
  client_name: string;
  status: string;
  sales_target: number;
  duration_months: number;
  product_focus: string;
  agents_required: number;
  target_stores: string[] | null;
  created_at: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface ProjectMetrics {
  totalSales: number;
  totalRevenue: number;
  totalGiveaways: number;
  totalSurveys: number;
  activeAgents: number;
  targetStoresCount: number;
  completionRate: number;
}

interface DailyData {
  date: string;
  sales: number;
  revenue: number;
  giveaways: number;
  surveys: number;
  activeAgents: number;
}

interface AgentData {
  agentId: string;
  agentName: string;
  totalSales: number;
  totalRevenue: number;
  giveaways: number;
  surveys: number;
  checkIns: number;
}

interface ProductData {
  productName: string;
  unitsSold: number;
  revenue: number;
}

export const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalSales: 0,
    totalRevenue: 0,
    totalGiveaways: 0,
    totalSurveys: 0,
    activeAgents: 0,
    targetStoresCount: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Export data state
  const [dailyBreakdown, setDailyBreakdown] = useState<DailyData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentData[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<ProductData[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchProjectMetrics();
    }
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('project_plans')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectMetrics = async () => {
    if (!projectId) return;

    try {
      // Get day plans for this project
      const { data: dayPlans, error: dayPlansError } = await supabase
        .from('day_plans')
        .select('id, date')
        .eq('project_id', projectId);

      if (dayPlansError) throw dayPlansError;

      const dayPlanIds = dayPlans?.map(dp => dp.id) || [];

      if (dayPlanIds.length === 0) {
        return;
      }

      // Get agent tasks for these day plans
      const { data: agentTasks, error: tasksError } = await supabase
        .from('agent_tasks')
        .select('id, agent_id, day_plan_id')
        .in('day_plan_id', dayPlanIds);

      if (tasksError) throw tasksError;

      const taskIds = agentTasks?.map(task => task.id) || [];
      const uniqueAgentIds = [...new Set(agentTasks?.map(task => task.agent_id).filter(Boolean) || [])];

      // Get agent names
      const { data: agentRoles } = await supabase
        .from('user_roles')
        .select('user_id, display_name')
        .in('user_id', uniqueAgentIds);

      const agentNameMap = new Map(agentRoles?.map(r => [r.user_id, r.display_name || 'Unknown']) || []);

      // Get interactions (sales & surveys) for these tasks
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('id, task_id, interaction_type, quantity_sold, sale_value, agent_id, product_variant_id, created_at')
        .in('task_id', taskIds);

      if (interactionsError) throw interactionsError;

      // Get product variant names
      const productVariantIds = [...new Set(interactions?.map(i => i.product_variant_id).filter(Boolean) || [])];
      const { data: productVariants } = await supabase
        .from('product_variants')
        .select('id, name, price')
        .in('id', productVariantIds);

      const productNameMap = new Map(productVariants?.map(p => [p.id, p.name]) || []);

      // Get giveaways
      const { data: giveaways } = await supabase
        .from('giveaways')
        .select('id, agent_id, total_items, created_at')
        .in('agent_id', uniqueAgentIds);

      // Get check-ins
      const { data: checkIns } = await supabase
        .from('agent_status_log')
        .select('id, agent_id, status, timestamp')
        .in('agent_id', uniqueAgentIds)
        .eq('status', 'checked_in');

      // Calculate metrics
      const salesInteractions = interactions?.filter(i => i.interaction_type === 'sale') || [];
      const surveyInteractions = interactions?.filter(i => i.interaction_type === 'survey') || [];
      
      const totalSales = salesInteractions.reduce((sum, i) => sum + (i.quantity_sold || 0), 0);
      const totalRevenue = salesInteractions.reduce((sum, i) => sum + (i.sale_value || 0), 0);
      const totalGiveaways = giveaways?.reduce((sum, g) => sum + (g.total_items || 0), 0) || 0;
      const totalSurveys = surveyInteractions.length;

      setMetrics({
        totalSales,
        totalRevenue,
        totalGiveaways,
        totalSurveys,
        activeAgents: uniqueAgentIds.length,
        targetStoresCount: project?.target_stores?.length || 0,
        completionRate: project?.sales_target ? (totalSales / project.sales_target) * 100 : 0,
      });

      // Calculate daily breakdown
      const dailyMap = new Map<string, DailyData>();
      
      // Process day plans dates
      dayPlans?.forEach(dp => {
        const dateStr = format(new Date(dp.date), 'yyyy-MM-dd');
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, {
            date: dateStr,
            sales: 0,
            revenue: 0,
            giveaways: 0,
            surveys: 0,
            activeAgents: 0,
          });
        }
      });

      // Add sales data
      salesInteractions.forEach(i => {
        if (i.created_at) {
          const dateStr = format(new Date(i.created_at), 'yyyy-MM-dd');
          const day = dailyMap.get(dateStr);
          if (day) {
            day.sales += i.quantity_sold || 0;
            day.revenue += i.sale_value || 0;
          }
        }
      });

      // Add survey data
      surveyInteractions.forEach(i => {
        if (i.created_at) {
          const dateStr = format(new Date(i.created_at), 'yyyy-MM-dd');
          const day = dailyMap.get(dateStr);
          if (day) {
            day.surveys += 1;
          }
        }
      });

      // Add giveaway data
      giveaways?.forEach(g => {
        if (g.created_at) {
          const dateStr = format(new Date(g.created_at), 'yyyy-MM-dd');
          const day = dailyMap.get(dateStr);
          if (day) {
            day.giveaways += g.total_items || 0;
          }
        }
      });

      // Calculate active agents per day from check-ins
      checkIns?.forEach(c => {
        if (c.timestamp) {
          const dateStr = format(new Date(c.timestamp), 'yyyy-MM-dd');
          const day = dailyMap.get(dateStr);
          if (day) {
            day.activeAgents += 1;
          }
        }
      });

      const sortedDaily = Array.from(dailyMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setDailyBreakdown(sortedDaily);

      // Calculate agent performance
      const agentMap = new Map<string, AgentData>();
      
      uniqueAgentIds.forEach(agentId => {
        if (agentId) {
          agentMap.set(agentId, {
            agentId,
            agentName: agentNameMap.get(agentId) || 'Unknown Agent',
            totalSales: 0,
            totalRevenue: 0,
            giveaways: 0,
            surveys: 0,
            checkIns: 0,
          });
        }
      });

      salesInteractions.forEach(i => {
        if (i.agent_id) {
          const agent = agentMap.get(i.agent_id);
          if (agent) {
            agent.totalSales += i.quantity_sold || 0;
            agent.totalRevenue += i.sale_value || 0;
          }
        }
      });

      surveyInteractions.forEach(i => {
        if (i.agent_id) {
          const agent = agentMap.get(i.agent_id);
          if (agent) {
            agent.surveys += 1;
          }
        }
      });

      giveaways?.forEach(g => {
        if (g.agent_id) {
          const agent = agentMap.get(g.agent_id);
          if (agent) {
            agent.giveaways += g.total_items || 0;
          }
        }
      });

      checkIns?.forEach(c => {
        if (c.agent_id) {
          const agent = agentMap.get(c.agent_id);
          if (agent) {
            agent.checkIns += 1;
          }
        }
      });

      const sortedAgents = Array.from(agentMap.values()).sort((a, b) => 
        b.totalRevenue - a.totalRevenue
      );
      setAgentPerformance(sortedAgents);

      // Calculate product breakdown
      const productMap = new Map<string, ProductData>();
      
      salesInteractions.forEach(i => {
        if (i.product_variant_id) {
          const productName = productNameMap.get(i.product_variant_id) || 'Unknown Product';
          const existing = productMap.get(productName);
          if (existing) {
            existing.unitsSold += i.quantity_sold || 0;
            existing.revenue += i.sale_value || 0;
          } else {
            productMap.set(productName, {
              productName,
              unitsSold: i.quantity_sold || 0,
              revenue: i.sale_value || 0,
            });
          }
        }
      });

      const sortedProducts = Array.from(productMap.values()).sort((a, b) => 
        b.revenue - a.revenue
      );
      setProductBreakdown(sortedProducts);

    } catch (error: any) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleExport = async (type: 'csv' | 'txt') => {
    if (!project) return;
    
    setExporting(true);
    
    try {
      const exportData: ProjectExportData = {
        project: {
          name: project.project_name || project.client_name,
          client: project.client_name,
          status: project.status,
          productFocus: project.product_focus,
          salesTarget: project.sales_target,
          durationMonths: project.duration_months,
          createdAt: format(new Date(project.created_at), 'yyyy-MM-dd'),
          description: project.description,
        },
        summary: {
          totalSales: metrics.totalSales,
          totalRevenue: metrics.totalRevenue,
          totalGiveaways: metrics.totalGiveaways,
          totalSurveys: metrics.totalSurveys,
          activeAgents: metrics.activeAgents,
          completionRate: metrics.completionRate,
        },
        dailyBreakdown: dailyBreakdown,
        agentPerformance: agentPerformance.map(a => ({
          agentName: a.agentName,
          totalSales: a.totalSales,
          totalRevenue: a.totalRevenue,
          giveaways: a.giveaways,
          surveys: a.surveys,
          checkIns: a.checkIns,
        })),
        productBreakdown: productBreakdown.map(p => ({
          ...p,
          percentOfTotal: metrics.totalRevenue > 0 
            ? (p.revenue / metrics.totalRevenue) * 100 
            : 0,
        })),
      };

      const filename = `${(project.project_name || project.client_name).replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}`;
      
      if (type === 'csv') {
        const content = generateCSV(exportData);
        downloadFile(content, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else {
        const content = generateTXT(exportData);
        downloadFile(content, `${filename}.txt`, 'text/plain;charset=utf-8;');
      }

      toast({
        title: "Export successful",
        description: `Project data exported as ${type.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SupervisorMobileLayout currentPage="planning">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
      </SupervisorMobileLayout>
    );
  }

  if (!project) {
    return (
      <SupervisorMobileLayout currentPage="planning">
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </SupervisorMobileLayout>
    );
  }

  return (
    <SupervisorMobileLayout currentPage="planning">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/supervisor/planning')}
            className="text-primary-foreground hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{project.project_name || project.client_name}</h1>
            <p className="text-sm opacity-90">Project Metrics</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary-foreground hover:bg-white/20"
                disabled={exporting}
              >
                <Download className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="w-4 h-4 mr-2" />
                Export as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 pb-20 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
            <p className="text-2xl font-bold">{metrics.totalSales.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {project.sales_target.toLocaleString()} target
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
            <p className="text-2xl font-bold">
              KES {metrics.totalRevenue.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">Active Agents</p>
            </div>
            <p className="text-2xl font-bold">{metrics.activeAgents}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {project.agents_required || 0} required
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
            <p className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</p>
          </Card>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">Giveaways</p>
            </div>
            <p className="text-2xl font-bold">{metrics.totalGiveaways.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">items distributed</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Surveys</p>
            </div>
            <p className="text-2xl font-bold">{metrics.totalSurveys.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">completed</p>
          </Card>
        </div>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Product Focus</p>
                <p className="text-sm text-muted-foreground">{project.product_focus}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Target Stores</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.targetStoresCount} stores targeted
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">{project.duration_months} months</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {project.description && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Agents Preview */}
        {agentPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agentPerformance.slice(0, 5).map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{agent.agentName}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">KES {agent.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{agent.totalSales} sales</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Product Breakdown Preview */}
        {productBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {productBreakdown.slice(0, 5).map((product) => {
                const percent = metrics.totalRevenue > 0 
                  ? (product.revenue / metrics.totalRevenue) * 100 
                  : 0;
                return (
                  <div key={product.productName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[60%]">{product.productName}</span>
                      <span className="text-muted-foreground">{product.unitsSold} units</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};