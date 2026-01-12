import { Users, Package, MoreHorizontal, Activity, BarChart3, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupervisorBottomNavigationProps {
  currentPage: string;
}

const navItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, path: "/supervisor-dashboard" },
  { id: "live-feed", label: "Live", icon: Activity, path: "/supervisor/live-feed" },
  { id: "agent-tracking", label: "Agents", icon: Users, path: "/supervisor/agent-tracking" },
  { id: "quick-stats", label: "Stats", icon: BarChart3, path: "/supervisor/quick-stats" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/supervisor-more" },
];

export const SupervisorBottomNavigation = ({ currentPage }: SupervisorBottomNavigationProps) => {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-secondary-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
