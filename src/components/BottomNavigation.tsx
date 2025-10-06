import { Home, ClipboardList, Map, Package, MoreHorizontal, Clipboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BottomNavigationProps {
  currentPage: string;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "reports", label: "Reports", icon: Clipboard, path: "/reports" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory" },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export const BottomNavigation = ({ currentPage }: BottomNavigationProps) => {
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
