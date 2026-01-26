import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface CheckInThumbnailProps {
  checkIn: {
    id: string;
    agentName: string;
    agentInitials: string;
    imageUrl?: string;
    timestamp: string;
    location?: string;
    status: 'checked_in' | 'on_break' | 'checked_out';
    isVerified?: boolean;
    distanceFromAssigned?: number;
  };
  onClick?: () => void;
}

const statusConfig = {
  checked_in: { color: 'bg-green-500', label: 'Active' },
  on_break: { color: 'bg-yellow-500', label: 'Break' },
  checked_out: { color: 'bg-red-500', label: 'Out' },
};

export const CheckInThumbnail = ({ checkIn, onClick }: CheckInThumbnailProps) => {
  const config = statusConfig[checkIn.status];
  const isOutOfRange = checkIn.distanceFromAssigned && checkIn.distanceFromAssigned > 100;

  return (
    <div 
      className="relative w-24 h-32 rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {checkIn.imageUrl ? (
        <img 
          src={checkIn.imageUrl} 
          alt={checkIn.agentName} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <span className="text-2xl font-bold text-muted-foreground">
            {checkIn.agentInitials}
          </span>
        </div>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${config.color} ring-2 ring-background`} />
      
      {/* Warning indicator */}
      {isOutOfRange && (
        <div className="absolute top-2 left-2 bg-amber-500 rounded-full p-1">
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-xs font-medium truncate">{checkIn.agentName}</p>
        <div className="flex items-center gap-1 text-white/80">
          <Clock className="w-3 h-3" />
          <span className="text-[10px]">{format(new Date(checkIn.timestamp), 'HH:mm')}</span>
        </div>
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-xs font-medium">View Details</span>
      </div>
    </div>
  );
};
