import { Calendar, CheckCircle, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PerformanceData {
  tasksToday: number;
  surveysCompleted: number;
  salesTarget: { current: number; target: number };
}

interface PerformanceCardsProps {
  data: PerformanceData;
}

export const PerformanceCards = ({ data }: PerformanceCardsProps) => {
  const salesProgress = (data.salesTarget.current / data.salesTarget.target) * 100;
  
  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3">Performance</h2>
      <div className="space-y-4">
        {/* Tasks for Today */}
        <div className="performance-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Calendar size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-h3">{data.tasksToday}</h3>
              <p className="text-secondary">Tasks for Today</p>
            </div>
          </div>
        </div>

        {/* Surveys Completed */}
        <div className="performance-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <h3 className="text-h3">{data.surveysCompleted}</h3>
              <p className="text-secondary">Surveys Completed</p>
            </div>
          </div>
        </div>

        {/* Sales Target */}
        <div className="performance-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <Target size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-h3">{data.salesTarget.current} / {data.salesTarget.target}</h3>
              <p className="text-secondary">Sales Target</p>
            </div>
          </div>
          <Progress value={salesProgress} className="h-2" />
        </div>
      </div>
    </div>
  );
};