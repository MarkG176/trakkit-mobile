import { Users, Calendar, Package, Trophy, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupervisorBottomNavigationProps {
  currentPage: string;
}

const navItems = [
  { id: "agent-tracking", label: "Agents", icon: Users, path: "/supervisor/agent-tracking" },
  { id: "daily-plan", label: "Plans", icon: Calendar, path: "/supervisor/daily-plan-approval" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/supervisor/inventory-management" },
  { id: "performance", label: "Performance", icon: Trophy, path: "/supervisor/performance-snapshot" },
  { id: "incidents", label: "Incidents", icon: AlertTriangle, path: "/supervisor/incident-reporting" },
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
