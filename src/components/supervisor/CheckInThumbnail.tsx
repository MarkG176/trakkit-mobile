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
      className="relative group cursor-pointer rounded-lg overflow-hidden bg-muted aspect-square"
      onClick={onClick}
    >
      {checkIn.imageUrl ? (
        <img 
          src={checkIn.imageUrl} 
          alt={`${checkIn.agentName}'s check-in`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10">
          <span className="text-2xl font-bold text-primary">
            {checkIn.agentInitials}
          </span>
        </div>
      )}
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      {/* Status indicator */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${config.color} ring-2 ring-white`} />
      
      {/* Warning indicator */}
      {isOutOfRange && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded">
          <AlertTriangle className="h-3 w-3" />
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
        <p className="font-semibold text-sm truncate">{checkIn.agentName}</p>
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Clock className="h-3 w-3" />
          <span>{format(new Date(checkIn.timestamp), 'HH:mm')}</span>
        </div>
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-sm font-medium">View Details</span>
      </div>
    </div>
  );
};
