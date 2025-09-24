import { MobileLayout } from "@/components/MobileLayout";
import { TopBar } from "@/components/dashboard/TopBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PerformanceCards } from "@/components/dashboard/PerformanceCards";
import { UpcomingSchedule } from "@/components/dashboard/UpcomingSchedule";

// Mock data
const performanceData = {
  tasksToday: 8,
  surveysCompleted: 12,
  salesTarget: { current: 7, target: 10 }
};

const scheduleData = [
  {
    id: "1",
    time: "09:30",
    title: "Customer Survey - Tech Corp",
    location: "123 Business Ave",
    type: "survey" as const
  },
  {
    id: "2", 
    time: "11:00",
    title: "Product Delivery",
    location: "456 Market St",
    type: "delivery" as const
  },
  {
    id: "3",
    time: "14:30",
    title: "Follow-up Meeting",
    location: "789 Corporate Blvd",
    type: "meeting" as const
  }
];

export const Dashboard = () => {
  return (
    <MobileLayout currentPage="dashboard">
      <TopBar agentName="Sarah" />
      <QuickActions />
      <PerformanceCards data={performanceData} />
      <UpcomingSchedule schedule={scheduleData} />
    </MobileLayout>
  );
};