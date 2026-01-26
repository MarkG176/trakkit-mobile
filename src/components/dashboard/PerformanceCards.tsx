import { Calendar, CheckCircle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useProjectConfig } from "@/hooks/useProjectConfig";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceData {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

interface PerformanceCardsProps {
  data: PerformanceData;
}

export const PerformanceCards = ({ data }: PerformanceCardsProps) => {
  const { features, isLoading } = useProjectConfig();
  const salesProgress = data.salesTarget.target > 0 ? (data.salesTarget.current / data.salesTarget.target) * 100 : 0;

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasAnyMetric = features.metrics.showTasksToday || 
                       features.metrics.showSurveyCount || 
                       features.metrics.showSalesTarget;

  if (!hasAnyMetric) {
    return null;
  }
  
  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3 text-black">Performance</h2>
      <div className="space-y-4">
        {/* Tasks for Today */}
        {features.metrics.showTasksToday && (
          <div className="performance-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-h3 text-black">{data.tasksToday}</h3>
                  <Label className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">Today</Label>
                </div>
                <p className="text-sm text-black">Tasks for Today</p>
              </div>
            </div>
          </div>
        )}

        {/* Surveys Completed */}
        {features.metrics.showSurveyCount && (
          <div className="performance-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-h3 text-black">{data.surveysCompleted}</h3>
                  <Label className="text-xs text-muted-foreground bg-green-500/10 px-2 py-1 rounded">Completed</Label>
                </div>
                <p className="text-sm text-black">Surveys Completed</p>
              </div>
            </div>
          </div>
        )}

        {/* Sales Target */}
        {features.metrics.showSalesTarget && (
          <div className="performance-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                <Target size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-h3 text-black">{data.salesTarget.current} / {data.salesTarget.target}</h3>
                  <Label className="text-xs text-muted-foreground bg-orange-500/10 px-2 py-1 rounded">{Math.round(salesProgress)}%</Label>
                </div>
                <p className="text-sm text-black">Sales Target</p>
              </div>
            </div>
            <Progress value={salesProgress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};
