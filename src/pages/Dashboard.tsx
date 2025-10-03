import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { UpcomingSchedule } from "@/components/dashboard/UpcomingSchedule";
import { CheckInOutDialog } from "@/components/dashboard/CheckInOutDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const Dashboard = () => {
  const { displayName: agentName, loading: profileLoading } = useUserProfile();
  const { performanceData, scheduleData, loading: dashboardLoading } = useDashboardData();
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  
  const loading = profileLoading || dashboardLoading;

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
      <TopBar agentName={agentName} onCameraCapture={handleCameraCapture} />
      <QuickActions />
      <PerformanceCards data={performanceData} />
      
      <div className="px-4 py-4">
        <Button 
          className="w-full h-14 flex items-center justify-center gap-2"
          onClick={() => setIsCheckInDialogOpen(true)}
        >
          <Clock size={20} />
          <span>Check In/Out</span>
        </Button>
      </div>

      <UpcomingSchedule schedule={scheduleData} />

      <CheckInOutDialog 
        isOpen={isCheckInDialogOpen} 
        onClose={() => setIsCheckInDialogOpen(false)} 
      />
    </MobileLayout>
  );
};