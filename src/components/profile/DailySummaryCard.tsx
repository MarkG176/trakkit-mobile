// [CMP-2eb170] DailySummaryCard — daily summary card component
import { Card, CardContent } from "@/components/ui/card";
import { Store, TrendingUp, ClipboardList, Gift, Clock } from "lucide-react";
import { useProjectCurrency } from "@/hooks/useProjectCurrency";

interface DailySummaryCardProps {
  storesAdded: number;
  sales: number;
  revenue: number;
  surveys: number;
  giveaways: number;
  giveawayItems: number;
  workMinutes: number;
}

export const DailySummaryCard = ({
  storesAdded,
  sales,
  revenue,
  surveys,
  giveaways,
  giveawayItems,
  workMinutes,
}: DailySummaryCardProps) => {
  const { formatAmount: formatCurrency } = useProjectCurrency();
  const formatWorkTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <h2 className="text-lg font-bold text-center mb-4 text-foreground">
          📊 TODAY'S SUMMARY
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Stores Added */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-center">
            <Store className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{storesAdded}</p>
            <p className="text-sm text-muted-foreground font-medium">Stores Added</p>
          </div>
          
          {/* Sales Made */}
          <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">{sales}</p>
            <p className="text-sm text-muted-foreground font-medium">Sales Made</p>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
              {formatCurrency(revenue)}
            </p>
          </div>
          
          {/* Surveys Done */}
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 text-center">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{surveys}</p>
            <p className="text-sm text-muted-foreground font-medium">Surveys Done</p>
          </div>
          
          {/* Giveaways */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 text-center">
            <Gift className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
            <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{giveaways}</p>
            <p className="text-sm text-muted-foreground font-medium">Giveaways</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
              {giveawayItems} items
            </p>
          </div>
        </div>
        
        {/* Work Hours */}
        <div className="bg-muted rounded-xl p-4 flex items-center justify-center gap-3">
          <Clock className="w-6 h-6 text-muted-foreground" />
          <div>
            <span className="text-2xl font-bold text-foreground">{formatWorkTime(workMinutes)}</span>
            <span className="text-sm text-muted-foreground ml-2">worked today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
