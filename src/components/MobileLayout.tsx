import { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { useToast } from "@/hooks/use-toast";

interface MobileLayoutProps {
  children: ReactNode;
  currentPage: string;
  onCameraCapture?: (imageData: string) => void;
}

export const MobileLayout = ({ children, currentPage, onCameraCapture }: MobileLayoutProps) => {
  const { toast } = useToast();

  const handleCameraCapture = (imageData: string) => {
    if (onCameraCapture) {
      onCameraCapture(imageData);
    } else {
      toast({
        title: "Photo captured",
        description: "Your photo has been captured successfully.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNavigation currentPage={currentPage} onCameraCapture={handleCameraCapture} />
    </div>
  );
};