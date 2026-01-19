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
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12">
            <AvatarImage src={activity.imageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {activity.agentInitials}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${config.color} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground truncate">{activity.agentName}</p>
            <Badge variant="secondary" className="shrink-0">
              {config.label}
            </Badge>
          </div>
          
          {activity.details && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {activity.details}
            </p>
          )}
          
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
            </div>
            {activity.location && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {activity.location}
              </div>
            )}
            {activity.value !== undefined && (
              <span className="font-medium text-primary ml-auto">
                KES {activity.value.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
