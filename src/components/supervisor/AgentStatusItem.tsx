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

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary'; color: string }> = {
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
    <Card className={cn("p-4", isNew && "ring-2 ring-primary animate-pulse")}>
      <div className="flex gap-3">
        <div className="relative">
          {selfieUrl ? (
            <Dialog open={showSelfie} onOpenChange={setShowSelfie}>
              <DialogTrigger asChild>
                <Avatar className="w-12 h-12 cursor-pointer ring-2 ring-offset-2 ring-primary/20 hover:ring-primary transition-all">
                  <AvatarImage src={selfieUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {agentInitials}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent className="max-w-md p-2">
                <img src={selfieUrl} alt={agentName} className="w-full rounded-lg" />
              </DialogContent>
            </Dialog>
          ) : (
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {agentInitials}
              </AvatarFallback>
            </Avatar>
          )}
          <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground truncate">{agentName}</p>
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </div>
            
            {locationLat && locationLng && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
              </div>
            )}
          </div>
          
          {isOutOfRange && (
            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              {distanceFromAssigned?.toFixed(0)}m from assigned location
            </div>
          )}
        </div>
        
        {selfieUrl && (
          <div className="flex items-center">
            <button 
              className="p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => setShowSelfie(true)}
            >
              <Image className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
