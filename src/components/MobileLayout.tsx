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
    <div className="min-h-[100dvh] min-h-screen bg-background">
      <BackgroundLocationTracker />
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <BottomNavigation currentPage={currentPage} />
    </div>
  );
};
