import { useState, useEffect } from "react";
import { SupervisorMobileLayout } from "@/components/SupervisorMobileLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [selectedPlan, setSelectedPlan] = useState<DayPlan | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingPlans();
  }, []);

  const fetchPendingPlans = async () => {
    try {
      const { data: dayPlans, error } = await supabase
        .from("day_plans")
        .select(`
          id,
          date,
          area_name,
          total_sales_target,
          status
        `)
        .eq("status", "pending")
        .order("date", { ascending: true });

      if (error) throw error;

      // For each plan, get agent tasks count
      const plansWithDetails = await Promise.all(
        (dayPlans || []).map(async (plan) => {
          const { count } = await supabase
            .from("agent_tasks")
            .select("*", { count: "exact", head: true })
            .eq("day_plan_id", plan.id);

          return {
            id: plan.id,
            date: plan.date,
            agentName: "Team Plan",
            agentEmail: "",
            areaName: plan.area_name,
            salesTarget: plan.total_sales_target || 0,
            status: plan.status,
            taskCount: count || 0,
          };
        })
      );

      setPlans(plansWithDetails);
    } catch (error: any) {
      toast({
        title: "Error loading plans",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("day_plans")
        .update({ status: "approved" })
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Plan approved",
        description: "The day plan has been approved successfully.",
      });

      fetchPendingPlans();
    } catch (error: any) {
      toast({
        title: "Error approving plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectPlan = async () => {
    if (!selectedPlan || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("day_plans")
        .update({
          status: "rejected",
          notes: rejectionReason,
        })
        .eq("id", selectedPlan.id);

      if (error) throw error;

      toast({
        title: "Plan rejected",
        description: "The day plan has been rejected.",
      });

      setShowRejectDialog(false);
      setSelectedPlan(null);
      setRejectionReason("");
      fetchPendingPlans();
    } catch (error: any) {
      toast({
        title: "Error rejecting plan",
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
            <h1 className="text-2xl font-bold">Team Planning</h1>
            <p className="text-sm opacity-90">Organize teams & agents</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Pending Plans</h2>
          <p className="text-sm text-muted-foreground">
            {plans.length} plan{plans.length !== 1 ? "s" : ""} awaiting review
          </p>
        </div>

        <div className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{plan.areaName}</h3>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
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

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">Sales Target</p>
                  <p className="text-sm font-semibold">
                    KES {plan.salesTarget.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted rounded p-2">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <p className="text-sm font-semibold">{plan.taskCount}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprovePlan(plan.id)}
                  className="flex-1"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowRejectDialog(true);
                  }}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </Card>
          ))}

          {plans.length === 0 && (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No pending plans to review</p>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this plan.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRejectPlan} variant="destructive">
              Reject Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SupervisorMobileLayout>
  );
};
