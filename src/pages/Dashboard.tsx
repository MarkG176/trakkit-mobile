import { useEffect, useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecordAttendanceForm } from "@/components/attendance/RecordAttendanceForm";
import { WorkHoursCard } from "@/components/attendance/WorkHoursCard";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

export const Dashboard = () => {
  const { user } = useAuth();
  const { currentWorkspaceId, currentTeamType } = useWorkspace();
  const isSeeding = currentTeamType?.toLowerCase() === 'seeding';
  const isSampling = currentTeamType?.toLowerCase() === 'sampling';
  const [stats, setStats] = useState<DashboardStats>({
    tasksToday: 0,
    surveysCompleted: 0,
    salesTarget: { current: 0, target: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && currentWorkspaceId) {
      fetchDashboardStats();
    }
  }, [user, currentWorkspaceId]);

  const fetchDashboardStats = async () => {
    if (!user || !currentWorkspaceId) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch projects for the workspace
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, start_date, end_date')
        .eq('workspace_id', currentWorkspaceId);

      // Fetch user roles (agents) for the workspace
      const { data: workspaceUsers } = await supabase
        .from('user_workspaces')
        .select('user_id')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_active', true);

      const userIds = workspaceUsers?.map(u => u.user_id) || [];
      
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, is_active')
        .in('user_id', userIds)
        .eq('role', 'agent');

      // Fetch survey responses for the workspace
      const { data: surveyResponses } = await supabase
        .from('survey_responses')
        .select('id, is_completed')
        .eq('workspace_id', currentWorkspaceId);

      // Fetch today's tasks for the current user
      const { data: tasksToday } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Fetch today's completed surveys for the current user
      const { data: surveysCompleted } = await supabase
        .from('interactions')
        .select('id, agent_tasks!inner(*)')
        .eq('agent_tasks.agent_id', user.id)
        .eq('interaction_type', 'survey')
        .eq('outcome', 'completed')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Fetch today's sales for the current user
      const { data: salesToday } = await supabase
        .from('interactions')
        .select('quantity_sold, agent_tasks!inner(*)')
        .eq('agent_tasks.agent_id', user.id)
        .eq('interaction_type', 'sale')
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => {
        const today = new Date();
        const startDate = new Date(p.start_date);
        const endDate = new Date(p.end_date);
        return today >= startDate && today <= endDate;
      }).length || 0;
      const completedProjects = projects?.filter(p => {
        const today = new Date();
        const endDate = new Date(p.end_date);
        return today > endDate;
      }).length || 0;
      
      const totalAgents = userRoles?.length || 0;
      const activeAgents = userRoles?.filter(ur => ur.is_active).length || 0;
      
      const totalSurveys = surveyResponses?.length || 0;
      
      // Calculate completion rate (active projects completion)
      const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

      // Calculate sales target progress
      const currentSales = salesToday?.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0) || 0;
      const salesTarget = 10; // Default target, could be fetched from user profile or workspace settings

      setStats({
        tasksToday: tasksToday?.length || 0,
        surveysCompleted: surveysCompleted?.length || 0,
        salesTarget: { 
          current: currentSales, 
          target: salesTarget 
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout currentPage="dashboard">
      <TopBar />
      
      {/* Record Attendance Form */}
      <div className="px-4 py-4 flex justify-center">
        <RecordAttendanceForm />
      </div>

      {/* Performance Cards - hidden for seeding and sampling */}
      {!isSeeding && !isSampling && <PerformanceCards data={stats} />}

      {!isSeeding && <QuickActions />}
      
      {/* Work Hours Card */}
      <div className="px-4 pb-4">
        <WorkHoursCard />
      </div>
    </MobileLayout>
  );
};