import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Target, Users, TrendingUp, Package, 
  Calendar, DollarSign, MapPin, Clock 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

interface ProjectMetrics {
  totalSales: number;
  totalRevenue: number;
  activeAgents: number;
  targetStoresCount: number;
  completionRate: number;
}

export const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalSales: 0,
    totalRevenue: 0,
    activeAgents: 0,
    targetStoresCount: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

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
        .select('id')
        .eq('project_id', projectId);

      if (dayPlansError) throw dayPlansError;

      const dayPlanIds = dayPlans?.map(dp => dp.id) || [];

      if (dayPlanIds.length === 0) {
        return;
      }

      // Get agent tasks for these day plans
      const { data: agentTasks, error: tasksError } = await supabase
        .from('agent_tasks')
        .select('id, agent_id')
        .in('day_plan_id', dayPlanIds);

      if (tasksError) throw tasksError;

      const taskIds = agentTasks?.map(task => task.id) || [];
      const uniqueAgents = new Set(agentTasks?.map(task => task.agent_id) || []);

      // Get interactions (sales) for these tasks
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('quantity_sold, sale_value')
        .in('task_id', taskIds)
        .eq('interaction_type', 'sale');

      if (interactionsError) throw interactionsError;

      const totalSales = interactions?.reduce((sum, i) => sum + (i.quantity_sold || 0), 0) || 0;
      const totalRevenue = interactions?.reduce((sum, i) => sum + (i.sale_value || 0), 0) || 0;

      setMetrics({
        totalSales,
        totalRevenue,
        activeAgents: uniqueAgents.size,
        targetStoresCount: project?.target_stores?.length || 0,
        completionRate: project?.sales_target ? (totalSales / project.sales_target) * 100 : 0,
      });
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
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
              <DollarSign className="w-4 h-4 text-success" />
              <p className="text-xs text-muted-foreground">Revenue</p>
            </div>
            <p className="text-2xl font-bold">
              KES {metrics.totalRevenue.toLocaleString()}
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-warning" />
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
      </div>
    </SupervisorMobileLayout>
  );
};
