import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useWorkspace } from "@/hooks/useWorkspace";

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
  const { currentWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchPendingPlans();
    }
  }, [currentWorkspaceId]);

  const fetchPendingPlans = async () => {
    try {
      if (!currentWorkspaceId) return;

      // Fetch day plans in current workspace
      const { data: dayPlans, error } = await supabase
        .from("day_plans")
        .select(`
          id,
          date,
          area_name,
          total_sales_target,
          status,
          notes,
          supervisor_id
        `)
        .eq("workspace_id", currentWorkspaceId)
        .eq("is_deleted", false)
        .order("date", { ascending: false });

      if (error) throw error;

      // Fetch supervisor names
      const supervisorIds = [...new Set(dayPlans?.map(dp => dp.supervisor_id).filter(Boolean) || [])];
      const { data: supervisors } = await supabase
        .from('user_roles')
        .select('user_id, display_name, email')
        .in('user_id', supervisorIds);

      const supervisorMap = new Map(
        supervisors?.map(s => [s.user_id, s.display_name || s.email]) || []
      );

      // Map day plans to the DayPlan interface format
      const plansData = (dayPlans || []).map(plan => ({
        id: plan.id,
        date: plan.date,
        areaName: plan.area_name,
        salesTarget: plan.total_sales_target || 0,
        status: plan.status || 'active',
        taskCount: 0,
        agentName: plan.supervisor_id ? supervisorMap.get(plan.supervisor_id) || 'N/A' : 'N/A',
        agentEmail: plan.notes || '',
      }));

      setPlans(plansData);
    } catch (error: any) {
      toast({
        title: "Error loading day plans",
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
            <h1 className="text-2xl font-bold">Day Plans</h1>
            <p className="text-sm opacity-90">Current workspace day plans</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        
        <div className="mt-3">
          <WorkspaceSwitcher onWorkspaceChange={fetchPendingPlans} />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Active Day Plans</h2>
          <p className="text-sm text-muted-foreground">
            {plans.length} day plan{plans.length !== 1 ? "s" : ""} in Capwell
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
                  <span className="text-sm text-muted-foreground">Supervisor</span>
                  <span className="font-medium">{plan.agentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sales Target</span>
                  <span className="font-medium text-sm">{plan.salesTarget}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-medium text-sm capitalize">{plan.status}</span>
                </div>
              </div>
            </Card>
          ))}

          {plans.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No day plans found</p>
            </Card>
          )}
        </div>
      </div>
    </SupervisorMobileLayout>
  );
};
