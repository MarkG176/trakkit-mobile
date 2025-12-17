import { Card, CardContent } from "@/components/ui/card";
import { Store, TrendingUp, ClipboardList, Gift, Clock } from "lucide-react";

interface WeeklySummaryCardProps {
  storesAdded: number;
  sales: number;
  revenue: number;
  surveys: number;
  giveaways: number;
  giveawayItems: number;
  workMinutes: number;
}

export const WeeklySummaryCard = ({
  storesAdded,
  sales,
  revenue,
  surveys,
  giveaways,
  giveawayItems,
  workMinutes,
}: WeeklySummaryCardProps) => {
  const formatWorkTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-bold text-center mb-4 text-foreground">
          📅 THIS WEEK
        </h2>
        
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <Store className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-xl font-bold text-foreground">{storesAdded}</p>
            <p className="text-xs text-muted-foreground">Stores</p>
          </div>
          
          <div className="text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600 dark:text-green-400" />
            <p className="text-xl font-bold text-foreground">{sales}</p>
            <p className="text-xs text-muted-foreground">Sales</p>
          </div>
          
          <div className="text-center">
            <ClipboardList className="w-5 h-5 mx-auto mb-1 text-purple-600 dark:text-purple-400" />
            <p className="text-xl font-bold text-foreground">{surveys}</p>
            <p className="text-xs text-muted-foreground">Surveys</p>
          </div>
          
          <div className="text-center">
            <Gift className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
            <p className="text-xl font-bold text-foreground">{giveaways}</p>
            <p className="text-xs text-muted-foreground">Giveaways</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatWorkTime(workMinutes)}</span>
          </div>
          <div className="text-green-600 dark:text-green-400 font-semibold">
            {formatCurrency(revenue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
