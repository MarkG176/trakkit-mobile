// [CMP-deb010] Dashboard — main agent dashboard screen
import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecordAttendanceForm } from "@/components/attendance/RecordAttendanceForm";
import { WorkHoursCard } from "@/components/attendance/WorkHoursCard";
import { useWorkspace } from "@/hooks/useWorkspace";
import { WorkspaceOnboarding } from "@/components/onboarding/WorkspaceOnboarding";

export const Dashboard = () => {
  const { currentWorkspaceId, userWorkspaces } = useWorkspace();
  const currentWorkspaceName = userWorkspaces.find(w => w.workspace_id === currentWorkspaceId)?.workspace?.name;

  return (
    <MobileLayout currentPage="dashboard">
      <WorkspaceOnboarding workspaceId={currentWorkspaceId} workspaceName={currentWorkspaceName} />
      <TopBar />
      
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