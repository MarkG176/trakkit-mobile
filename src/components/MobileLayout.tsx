import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
}

export const MobileLayout = ({ children, currentPage }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNavigation currentPage={currentPage} />
    </div>
  );
};