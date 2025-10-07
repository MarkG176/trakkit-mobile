import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecordAttendanceForm } from "@/components/attendance/RecordAttendanceForm";
import { WorkHoursCard } from "@/components/attendance/WorkHoursCard";
import { useAuth } from "@/hooks/useAuth";

export const Dashboard = () => {
  const { user } = useAuth();

  const handleCameraCapture = (imageData: string) => {
    // Camera capture is now handled by CameraCapture component in TopBar
  };

  return (
    <MobileLayout currentPage="dashboard">
      <TopBar onCameraCapture={handleCameraCapture} />
      
      {/* Record Attendance Form */}
      <div className="px-4 py-4 flex justify-center">
        <RecordAttendanceForm />
      </div>

      <QuickActions />
      
      {/* Work Hours Card */}
      <div className="px-4 pb-4">
        <WorkHoursCard />
      </div>
    </MobileLayout>
  );
};