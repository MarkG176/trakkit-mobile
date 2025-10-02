import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useToast } from "@/hooks/use-toast";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onCameraCapture?: (imageData: string) => void;
}

export const MobileLayout = ({ children, currentPage, onCameraCapture }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNavigation currentPage={currentPage} />
    </div>
  );
};