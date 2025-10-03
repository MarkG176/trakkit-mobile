import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/shared/AppHeader";
import { fetchDashboardStats, fetchRecentActivity, DashboardStats } from "@/services/dashboardService";
import { useProjectPlans } from "@/hooks/useProjectPlans";
import { getAgentInventorySessions } from "@/services/inventoryService";
import { useAgentTeamInfo } from "@/hooks/useAgentTeamInfo";
import ProductAssignmentDashboard from "@/components/dashboard/ProductAssignmentDashboard";
import { RecordAttendanceForm } from "@/components/attendance/RecordAttendanceForm";
import { WorkHoursCard } from "@/components/attendance/WorkHoursCard";
import { Activity, ArrowRight, MapPin, Target } from "lucide-react";
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { UpcomingSchedule } from "@/components/dashboard/UpcomingSchedule";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isSupervisor, isAgent } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [agentInventory, setAgentInventory] = useState<any>(null);
  const [agentInventoryLoading, setAgentInventoryLoading] = useState(false);

  // --- Use unified dashboard hook (from File A) ---
  const { performanceData, scheduleData, loading: dashboardLoading } =
    useDashboardData();

  // Fetch additional data (from File B)
  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: () => fetchDashboardStats(user?.id),
    enabled: !!isAuthenticated && !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity", user?.id],
    queryFn: () => fetchRecentActivity(user?.id),
    enabled: !!isAuthenticated && !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { projectPlans = [], isLoading: projectsLoading } = useProjectPlans();
  const { data: agentTeamInfo, isLoading: teamInfoLoading } = useAgentTeamInfo(
    user?.id
  );

  // Fetch agent inventory (from File B)
  useEffect(() => {
    const fetchInventory = async () => {
      if (isAgent && user?.id) {
        setAgentInventoryLoading(true);
        try {
          const sessions = await getAgentInventorySessions(user.id);
          const today = new Date().toISOString().split("T")[0];
          const todaySession = sessions.find((s: any) => s.date === today);
          setAgentInventory(todaySession || null);
        } finally {
          setAgentInventoryLoading(false);
        }
      }
    };
    fetchInventory();
  }, [isAgent, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  if (dashboardLoading || statsLoading) {
    return (
      <MobileLayout currentPage="dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const handleCameraCapture = (imageData: string) => {
    // still handled in TopBar’s CameraCapture
  };

  return (
    <MobileLayout currentPage="dashboard">
      {/* Top Navigation Bar */}
      <TopBar onCameraCapture={handleCameraCapture} />

      {/* Quick Actions */}
      <QuickActions />

      {/* App Header */}
      <AppHeader
        subtitle="Your performance overview and insights"
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <div className="pb-20 pt-8 px-6 max-w-7xl mx-auto">
        {/* Attendance + Work Hours (Agents only) */}
        {isAgent && (
          <>
            <div className="mb-8 flex justify-center">
              <RecordAttendanceForm />
            </div>
            <div className="mb-8">
              <WorkHoursCard />
            </div>
          </>
        )}

        {/* Supervisor-specific sections */}
        {isSupervisor && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <ProductAssignmentDashboard />
            </motion.div>

            {/* Ongoing Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ongoing Projects</CardTitle>
                      <CardDescription>
                        Click a project to view details and day plans
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/planning?tab=projects")}
                    >
                      View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-gray-500">Loading projects...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projectPlans.length > 0 ? (
                        projectPlans.slice(0, 4).map((plan: any) => (
                          <div
                            key={plan.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-primary/10 transition"
                            onClick={() =>
                              navigate(
                                `/planning?tab=projects&project=${plan.id}`
                              )
                            }
                          >
                            <div className="flex items-center space-x-3">
                              <Target className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="font-medium text-sm">
                                  {plan.client_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {plan.product_focus}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                plan.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No ongoing projects
                          </p>
                          <p className="text-gray-400 text-xs">
                            Create a project to see it here
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader className="py-0">
                  <div className="flex items-center justify-between px-0 mx-[10px] my-[20px]">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Your latest tasks and apartment visits
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/route-planning")}
                    >
                      View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-gray-500">
                        Loading recent activity...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activity?.recentTasks &&
                      activity.recentTasks.length > 0 ? (
                        activity.recentTasks.slice(0, 3).map((task: any) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="font-medium text-sm">
                                  {task.location_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {task.address}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No recent activity
                          </p>
                          <p className="text-gray-400 text-xs">
                            Complete some tasks to see them here
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Performance cards + Upcoming Schedule (from File A) */}
        <PerformanceCards data={performanceData} />
        <UpcomingSchedule schedule={scheduleData} />
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
