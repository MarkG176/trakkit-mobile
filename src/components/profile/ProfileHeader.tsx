import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star } from "lucide-react";

interface ProfileHeaderProps {
  displayName: string;
  currentRank: string;
  totalPoints: number;
}

export const ProfileHeader = ({ displayName, currentRank, totalPoints }: ProfileHeaderProps) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-primary text-primary-foreground p-6 pb-8">
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
          <AvatarImage src="/placeholder-avatar.jpg" />
          <AvatarFallback className="bg-primary-foreground text-primary text-xl font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
              <Trophy className="w-3 h-3 mr-1" />
              {currentRank}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-primary-foreground/90">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">{totalPoints.toLocaleString()}</span>
            <span className="text-sm opacity-80">points</span>
          </div>
        </div>
      </div>
      
      <div className="text-center pt-2 border-t border-primary-foreground/20">
        <p className="text-lg font-medium">{formattedDate}</p>
      </div>
    </div>
  );
};
