import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, TrendingUp, Users, Package, DollarSign } from "lucide-react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay } from "date-fns";

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  start_date: string | null;
  end_date: string | null;
  sales_target: number;
  product_focus: string;
}

interface DailyReport {
  date: string;
  sales: number;
  interactions: number;
  revenue: number;
}

interface AgentReport {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  total_sales: number;
  total_revenue: number;
}

export const ReportsAnalytics = () => {
  const { currentWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [agentReports, setAgentReports] = useState<AgentReport[]>([]);
  const [projectStats, setProjectStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    activeAgents: 0,
    completionRate: 0
  });

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchProjects();
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectReports();
    }
  }, [selectedProject, currentWeekStart]);

  const fetchProjects = async () => {
    if (!currentWorkspaceId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_plans')
        .select('*')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      toast.error("Failed to load projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectReports = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      const project = projects.find(p => p.id === selectedProject);
      if (!project) return;

      const weekEnd = endOfWeek(currentWeekStart);
      const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

      // Fetch agents assigned to this project via day_plans
      const { data: dayPlans, error: dayPlansError } = await supabase
        .from('day_plans')
        .select('id')
        .eq('project_id', selectedProject)
        .eq('workspace_id', currentWorkspaceId);

      if (dayPlansError) throw dayPlansError;

      const dayPlanIds = dayPlans?.map(dp => dp.id) || [];

      // Fetch agent tasks linked to these day plans
      const { data: agentTasks, error: agentTasksError } = await supabase
        .from('agent_tasks')
        .select('id, agent_id')
        .in('day_plan_id', dayPlanIds)
        .eq('workspace_id', currentWorkspaceId);

      if (agentTasksError) throw agentTasksError;

      const taskIds = agentTasks?.map(at => at.id) || [];
      const uniqueAgentIds = Array.from(new Set(agentTasks?.map(at => at.agent_id) || []));

      // Fetch interactions linked to these tasks
      const { data: interactions, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .in('task_id', taskIds)
        .eq('workspace_id', currentWorkspaceId)
        .gte('timestamp', currentWeekStart.toISOString())
        .lte('timestamp', weekEnd.toISOString());

      if (interactionsError) throw interactionsError;

      // Build daily reports
      const daily = weekDays.map(day => {
        const dayInteractions = (interactions || []).filter(i => 
          isSameDay(new Date(i.timestamp), day)
        );
        
        return {
          date: format(day, 'yyyy-MM-dd'),
          sales: dayInteractions.filter(i => i.interaction_type === 'sale').length,
          interactions: dayInteractions.length,
          revenue: dayInteractions.reduce((sum, i) => sum + (i.sale_value || 0), 0)
        };
      });

      setDailyReports(daily);

      // Calculate project stats (for all time, not just current week)
      const { data: allInteractions, error: allInteractionsError } = await supabase
        .from('interactions')
        .select('*')
        .in('task_id', taskIds)
        .eq('workspace_id', currentWorkspaceId);

      if (allInteractionsError) throw allInteractionsError;

      const totalSales = (allInteractions || []).filter(i => i.interaction_type === 'sale').length;
      const totalRevenue = (allInteractions || []).reduce((sum, i) => sum + (i.sale_value || 0), 0);
      
      setProjectStats({
        totalSales,
        totalRevenue,
        activeAgents: uniqueAgentIds.length,
        completionRate: project.sales_target > 0 ? Math.round((totalSales / project.sales_target) * 100) : 0
      });

      // Fetch agent details
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', uniqueAgentIds);

      if (userError) throw userError;

      // Build agent reports
      const agents = uniqueAgentIds.map(agentId => {
        const user = userData?.find(u => u.user_id === agentId);
        const agentTaskIds = agentTasks?.filter(at => at.agent_id === agentId).map(at => at.id) || [];
        const agentInteractions = (allInteractions || []).filter(i => agentTaskIds.includes(i.task_id || ''));
        const agentSales = agentInteractions.filter(i => i.interaction_type === 'sale');
        
        return {
          agent_id: agentId,
          agent_name: user?.display_name || 'Unknown',
          agent_email: user?.email || '',
          total_sales: agentSales.length,
          total_revenue: agentSales.reduce((sum, i) => sum + (i.sale_value || 0), 0)
        };
      });

      setAgentReports(agents);
    } catch (error: any) {
      toast.error("Failed to load reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <SupervisorMobileLayout currentPage="more">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Project Reports</h1>
            <p className="text-sm opacity-90">Analytics and performance tracking</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchProjects} />
        </div>
      </div>

      <div className="p-4 pb-20">
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Select Project</label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.project_name || project.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProject && (
          <Tabs defaultValue="project" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">Project Mode</TabsTrigger>
              <TabsTrigger value="agent">Agent Mode</TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="space-y-4">
              {/* Weekly Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart), 'MMM d, yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                >
                  Next
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Daily Reports Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dailyReports.map((report, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{format(new Date(report.date), 'EEE, MMM d')}</span>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <div className="text-right">
                              <div className="font-semibold">{report.sales}</div>
                              <div className="text-muted-foreground text-xs">Sales</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">KES {report.revenue.toFixed(0)}</div>
                              <div className="text-muted-foreground text-xs">Revenue</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Project Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Project Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{currentProject?.project_name || currentProject?.client_name}</h3>
                      <p className="text-sm text-muted-foreground">{currentProject?.product_focus}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Sales</p>
                          <p className="font-semibold">{projectStats.totalSales}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="font-semibold">KES {projectStats.totalRevenue.toFixed(0)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Active Agents</p>
                          <p className="font-semibold">{projectStats.activeAgents}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Completion</p>
                          <p className="font-semibold">{projectStats.completionRate}%</p>
                        </div>
                      </div>
                    </div>

                    {currentProject?.start_date && currentProject?.end_date && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Project Duration</p>
                        <p className="text-sm font-medium">
                          {format(new Date(currentProject.start_date), 'MMM d, yyyy')} - {format(new Date(currentProject.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="agent" className="space-y-4">
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Select Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agentReports.map((agent) => (
                      <SelectItem key={agent.agent_id} value={agent.agent_id}>
                        {agent.agent_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentProject?.start_date && currentProject?.end_date && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Reporting Period</p>
                    <p className="font-medium">
                      {format(new Date(currentProject.start_date), 'MMM d, yyyy')} - {format(new Date(currentProject.end_date), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-3">
                {(selectedAgent === 'all' ? agentReports : agentReports.filter(a => a.agent_id === selectedAgent)).map((agent) => (
                  <Card key={agent.agent_id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{agent.agent_name}</h3>
                          <p className="text-xs text-muted-foreground">{agent.agent_email}</p>
                        </div>
                        <Badge variant={agent.total_sales > 0 ? "default" : "secondary"}>
                          {agent.total_sales > 0 ? "Active" : "No Sales"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Sales</p>
                          <p className="text-lg font-semibold">{agent.total_sales}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold">KES {agent.total_revenue.toFixed(0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {loading && (
          <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
        )}

        {!selectedProject && !loading && projects.length === 0 && (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No projects found. Create a project first.</p>
            </div>
          </Card>
        )}
      </div>
    </SupervisorMobileLayout>
  );
};
