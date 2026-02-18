import { Home, ClipboardList, Map, Package, MoreHorizontal, Clipboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

interface BottomNavigationProps {
  currentPage: string;
  currentTeamType?: string | null;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "reports", label: "Reports", icon: Clipboard, path: "/reports" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export const BottomNavigation = ({ currentPage, currentTeamType }: BottomNavigationProps) => {
  const navigate = useNavigate();

  // Filter nav items based on team type
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      const teamType = currentTeamType?.toLowerCase();
      // Hide Reports and Inventory for wholesale team type
      if (teamType === 'wholesale' && (item.id === 'reports' || item.id === 'inventory')) {
        return false;
      }
      // Hide Reports and Surveys for seeding team type
      if (teamType === 'seeding' && (item.id === 'reports' || item.id === 'surveys')) {
        return false;
      }
      return true;
    });
  }, [currentTeamType]);

  return (
    <div className="bottom-nav">
      <div className="flex justify-around items-center h-16">
        {filteredNavItems.map((item) => {
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
