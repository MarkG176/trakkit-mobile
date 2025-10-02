import { Bell, Search, Camera } from "lucide-react";
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
  
  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-h3">Hello, {agentName}!</span>
          <span className="text-secondary">{currentTime}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="btn-ghost"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={20} className="text-secondary-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="btn-ghost">
            <Search size={20} className="text-secondary-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="btn-ghost relative">
            <Bell size={20} className="text-secondary-foreground" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-3">
        <StatusBar status={currentStatus} loading={loading} />
        <CameraCapture mode="general" onCapture={onCameraCapture} ref={cameraInputRef} />
      </div>
    </div>
  );
};