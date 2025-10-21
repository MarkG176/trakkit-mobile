import { ReactNode } from "react";
import { SupervisorBottomNavigation } from "./SupervisorBottomNavigation";

interface SupervisorMobileLayoutProps {
  children: ReactNode;
  currentPage: string;
}

export const SupervisorMobileLayout = ({ children, currentPage }: SupervisorMobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <SupervisorBottomNavigation currentPage={currentPage} />
    </div>
  );
};
