import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DayPlan {
  id: string;
  date: string;
  agentName: string;
  agentEmail: string;
  areaName: string;
  salesTarget: number;
  status: string;
  taskCount: number;
}

export const DailyPlanApproval = () => {
  const [plans, setPlans] = useState<DayPlan[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPlans();
  }, []);

  const fetchPendingPlans = async () => {
    try {
      // Get Capwell workspace ID
      const { data: capwellWorkspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('name', 'Capwell')
        .single();

      if (workspaceError) throw workspaceError;

      // Fetch projects in Capwell workspace
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          description,
          client_name,
          start_date,
          end_date
        `)
        .eq("workspace_id", capwellWorkspace.id)
        .order("start_date", { ascending: false });

      if (error) throw error;

      // Map projects to the DayPlan interface format
      const projectsAsPlan = (projects || []).map(project => ({
        id: project.id,
        date: project.start_date,
        areaName: project.name,
        salesTarget: 0,
        status: 'active',
        taskCount: 0,
        agentName: project.client_name || 'N/A',
        agentEmail: project.description || '',
      }));

      setPlans(projectsAsPlan);
    } catch (error: any) {
      toast({
        title: "Error loading projects",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <SupervisorMobileLayout currentPage="daily-plan">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm opacity-90">Capwell workspace projects</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Active Projects</h2>
          <p className="text-sm text-muted-foreground">
            {plans.length} project{plans.length !== 1 ? "s" : ""} in Capwell
          </p>
        </div>

        <div className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{plan.areaName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(plan.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="font-medium">{plan.agentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="font-medium text-sm">{plan.agentEmail || 'N/A'}</span>
                </div>
              </div>
            </Card>
          ))}

          {plans.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No projects found</p>
            </Card>
          )}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
