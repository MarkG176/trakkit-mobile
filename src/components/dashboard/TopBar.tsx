import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  agentName: string;
}

export const TopBar = ({ agentName }: TopBarProps) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-h3">Hello, {agentName}!</span>
        <span className="text-secondary">{currentTime}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="btn-ghost">
          <Search size={20} className="text-secondary-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="btn-ghost relative">
          <Bell size={20} className="text-secondary-foreground" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
        </Button>
      </div>
    </div>
  );
};