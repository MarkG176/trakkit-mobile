import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { UpcomingSchedule } from "@/components/dashboard/UpcomingSchedule";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Dashboard = () => {
  const { performanceData, scheduleData, loading: dashboardLoading } = useDashboardData();
  
  const loading = dashboardLoading;

  if (loading) {
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
    // Camera capture is now handled by CameraCapture component in TopBar
  };

  return (
    <MobileLayout currentPage="dashboard">
      <TopBar onCameraCapture={handleCameraCapture} />
      <QuickActions />
      <PerformanceCards data={performanceData} />
      <UpcomingSchedule schedule={scheduleData} />
    </MobileLayout>
  );
};