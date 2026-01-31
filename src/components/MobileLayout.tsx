import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useWorkspace } from "@/hooks/useWorkspace";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onCameraCapture?: (imageData: string) => void;
}

export const MobileLayout = ({ children, currentPage, onCameraCapture }: MobileLayoutProps) => {
  const { currentTeamType } = useWorkspace();

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNavigation currentPage={currentPage} currentTeamType={currentTeamType} />
    </div>
  );
};