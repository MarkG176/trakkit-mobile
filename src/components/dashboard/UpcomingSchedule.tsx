import { Clock, MapPin } from "lucide-react";

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  type: "survey" | "meeting" | "delivery";
}

interface UpcomingScheduleProps {
  schedule: ScheduleItem[];
}

export const UpcomingSchedule = ({ schedule }: UpcomingScheduleProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "survey": return "text-primary";
      case "meeting": return "text-warning";
      case "delivery": return "text-success";
      default: return "text-secondary-foreground";
    }
  };

  return (
    <div className="px-4 py-4">
      <h2 className="text-h3 mb-3">Upcoming Schedule</h2>
      <div className="space-y-3">
        {schedule.map((item) => (
          <div key={item.id} className="performance-card">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1 text-secondary">
                <Clock size={16} />
                <span className="text-xs">{item.time}</span>
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-medium ${getTypeColor(item.type)}`}>
                  {item.title}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={12} className="text-secondary-foreground" />
                  <span className="text-xs text-secondary-foreground">{item.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {schedule.length === 0 && (
          <div className="performance-card text-center py-6">
            <p className="text-secondary">No upcoming tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};