// [CMP-957c2f] GalleryPage — supervisor check-in gallery page
import { useState } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SupervisorBottomNav } from "@/components/supervisor/SupervisorBottomNav";
import { MobileGalleryTab } from "@/components/supervisor/MobileGalleryTab";

export const GalleryPage = () => {
  const { currentWorkspaceId } = useWorkspace();
  
  // Date range state - you can add date pickers if needed
  const [startDate] = useState<string | null>(null);
  const [endDate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <h1 className="text-xl font-bold">Gallery</h1>
        <p className="text-sm opacity-90">Agent photos and check-in selfies</p>
      </div>

      {/* Gallery Content */}
      <div className="flex-1">
        <MobileGalleryTab 
          workspaceId={currentWorkspaceId} 
          startDate={startDate} 
          endDate={endDate} 
        />
      </div>

      <SupervisorBottomNav />
    </div>
  );
};
