import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from "lucide-react";

interface LeaderboardCardProps {
  rank: number;
  agent: {
    id: string;
    name: string;
    initials: string;
    imageUrl?: string;
    value: number;
    metric: string;
    trend?: 'up' | 'down' | 'same';
    previousRank?: number;
  };
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    case 3:
      return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
    default:
      return '';
  }
};

export const LeaderboardCard = ({ rank, agent }: LeaderboardCardProps) => {
  const rankChange = agent.previousRank ? agent.previousRank - rank : 0;

  return (
    <Card className={`p-4 border ${getRankBg(rank)}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-8">
          {getRankIcon(rank)}
        </div>
        
        <Avatar className="h-12 w-12">
          <AvatarImage src={agent.imageUrl} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {agent.initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-bold text-primary">
              {agent.value.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">{agent.metric}</span>
          </div>
        </div>
        
        {rankChange !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${
            rankChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {rankChange > 0 ? (
              <>
                <TrendingUp className="h-3 w-3" />
                <span>+{rankChange}</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3" />
                <span>{rankChange}</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
