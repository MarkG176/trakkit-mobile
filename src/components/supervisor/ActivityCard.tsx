import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, ShoppingCart, Gift, ClipboardCheck, LogIn, LogOut, Coffee } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityCardProps {
  activity: {
    id: string;
    type: 'check_in' | 'check_out' | 'sale' | 'giveaway' | 'survey' | 'break_start' | 'break_end';
    agentName: string;
    agentInitials: string;
    timestamp: string;
    location?: string;
    details?: string;
    value?: number;
    imageUrl?: string;
  };
}

const activityConfig = {
  check_in: { icon: LogIn, color: 'bg-green-500', label: 'Checked In' },
  check_out: { icon: LogOut, color: 'bg-red-500', label: 'Checked Out' },
  sale: { icon: ShoppingCart, color: 'bg-blue-500', label: 'Sale' },
  giveaway: { icon: Gift, color: 'bg-purple-500', label: 'Giveaway' },
  survey: { icon: ClipboardCheck, color: 'bg-orange-500', label: 'Survey' },
  break_start: { icon: Coffee, color: 'bg-yellow-500', label: 'On Break' },
  break_end: { icon: Coffee, color: 'bg-green-500', label: 'Back from Break' },
};

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const config = activityConfig[activity.type] || activityConfig.check_in;
  const Icon = config.icon;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={activity.imageUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {activity.agentInitials}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 ${config.color} rounded-full p-1`}>
            <Icon className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm truncate">{activity.agentName}</h4>
            <Badge variant="secondary" className="text-xs shrink-0">
              {config.label}
            </Badge>
          </div>
          
          {activity.details && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {activity.details}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
            </div>
            {activity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{activity.location}</span>
              </div>
            )}
            {activity.value !== undefined && (
              <span className="font-medium text-primary">
                KES {activity.value.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
