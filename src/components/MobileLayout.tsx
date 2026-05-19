// [CMP-6118e9] MobileLayout — agent mobile shell with background tracker + bottom nav
import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { BackgroundLocationTracker } from "./BackgroundLocationTracker";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onCameraCapture?: (imageData: string) => void;
}

export const MobileLayout = ({ children, currentPage }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <BackgroundLocationTracker />
      {children}
      <BottomNavigation currentPage={currentPage} />
    </div>
  );
};
