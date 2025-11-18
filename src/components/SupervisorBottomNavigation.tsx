import { Users, Calendar, Package, Trophy, AlertTriangle, MoreHorizontal, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SupervisorBottomNavigationProps {
  currentPage: string;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Users, path: "/supervisor-dashboard" },
  { id: "agent-tracking", label: "Agents", icon: Users, path: "/supervisor/agent-tracking" },
  { id: "planning", label: "Planning", icon: Briefcase, path: "/supervisor/planning" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/supervisor/inventory-management" },
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
