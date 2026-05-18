// [CMP-c145c1] FeedbackPage — supervisor feedback page
import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { MobileFeedbackTab } from "@/components/supervisor/MobileFeedbackTab";

export const FeedbackPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  
  // Date range state - you can add date pickers if needed
  const [startDate] = useState<string | null>(null);
  const [endDate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Feedback</h1>
        <p className="text-sm opacity-90">Customer notes and feedback</p>
      </div>

      {/* Feedback Content */}
      <div className="flex-1">
        <MobileFeedbackTab 
          workspaceId={currentWorkspaceId} 
          startDate={startDate} 
          endDate={endDate} 
        />
      </div>

      <SupervisorBottomNav />
    </div>
  );
};
