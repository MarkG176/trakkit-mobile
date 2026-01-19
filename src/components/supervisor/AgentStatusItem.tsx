import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, AlertTriangle, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

export interface AgentStatusItemProps {
  id: string;
  agentName: string;
  agentInitials: string;
  status: 'checked_in' | 'checked_out' | 'lunch' | 'break';
  timestamp: string;
  locationLat?: number;
  locationLng?: number;
  selfieUrl?: string;
  distanceFromAssigned?: number;
  inRange?: boolean;
  isNew?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  checked_in: { label: 'Checked In', variant: 'default', color: 'bg-green-500' },
  checked_out: { label: 'Checked Out', variant: 'destructive', color: 'bg-red-500' },
  lunch: { label: 'On Break', variant: 'secondary', color: 'bg-amber-500' },
  break: { label: 'On Break', variant: 'secondary', color: 'bg-amber-500' },
};

export const AgentStatusItem = ({
  agentName,
  agentInitials,
  status,
  timestamp,
  locationLat,
  locationLng,
  selfieUrl,
  distanceFromAssigned,
  inRange,
  isNew = false,
}: AgentStatusItemProps) => {
  const [showSelfie, setShowSelfie] = useState(false);
  const config = statusConfig[status] || statusConfig.checked_out;
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  const isOutOfRange = inRange === false && distanceFromAssigned && distanceFromAssigned > 100;

  return (
    <Card className={cn(
      "p-3 transition-all duration-300",
      isNew && "ring-2 ring-primary/50 animate-pulse"
    )}>
      <div className="flex items-start gap-3">
        <div className="relative">
          {selfieUrl ? (
            <Dialog open={showSelfie} onOpenChange={setShowSelfie}>
              <DialogTrigger asChild>
                <Avatar className="h-11 w-11 cursor-pointer ring-2 ring-offset-2 ring-offset-background ring-border hover:ring-primary transition-all">
                  <AvatarImage src={selfieUrl} alt={agentName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {agentInitials}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent className="max-w-sm p-0 overflow-hidden">
                <img src={selfieUrl} alt={`${agentName} check-in`} className="w-full h-auto" />
              </DialogContent>
            </Dialog>
          ) : (
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {agentInitials}
              </AvatarFallback>
            </Avatar>
          )}
          <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-sm truncate">{agentName}</p>
            <Badge variant={config.variant} className="shrink-0 text-xs">
              {config.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
            
            {locationLat && locationLng && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{locationLat.toFixed(4)}, {locationLng.toFixed(4)}</span>
              </div>
            )}
          </div>
          
          {isOutOfRange && (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{distanceFromAssigned?.toFixed(0)}m from assigned location</span>
            </div>
          )}
        </div>
        
        {selfieUrl && (
          <div className="shrink-0">
            <div 
              className="h-8 w-8 rounded bg-muted flex items-center justify-center cursor-pointer hover:bg-accent"
              onClick={() => setShowSelfie(true)}
            >
              <Image className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
