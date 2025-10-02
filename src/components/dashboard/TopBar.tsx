import { Bell, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBar } from "@/components/StatusBar";
import { CameraCapture } from "@/components/CameraCapture";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useRef } from "react";

interface TopBarProps {
  agentName: string;
  onCameraCapture?: (imageData: string) => void;
}

export const TopBar = ({ agentName, onCameraCapture }: TopBarProps) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const { currentStatus, loading } = useAgentStatus();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };
  
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <Button 
            ref={cameraButtonRef}
            variant="ghost" 
            size="icon" 
            className="btn-ghost"
            onClick={handleCameraClick}
          >
            <Camera size={20} className="text-secondary-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="btn-ghost">
            <Bell size={20} className="text-secondary-foreground" />
          </Button>
        </div>
        
        <div className="text-center mb-2">
          <span className="text-h3">Hello, {agentName}!</span>
          <br />
          <span className="text-secondary">{currentTime}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-3">
        <StatusBar status={currentStatus} loading={loading} />
        <CameraCapture ref={cameraInputRef} mode="general" variant="inline" onCapture={onCameraCapture} />
      </div>
    </div>
  );
};