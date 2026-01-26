import { Home, ClipboardList, Map, Package, MoreHorizontal, Clipboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/useWorkspace";
interface BottomNavigationProps {
  currentPage: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  featureKey?: 'surveys' | 'routes' | 'inventory' | 'reports';
}

const allNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory", featureKey: 'inventory' },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys", featureKey: 'surveys' },
  { id: "routes", label: "Routes", icon: Map, path: "/routes", featureKey: 'routes' },
  { id: "reports", label: "Reports", icon: Clipboard, path: "/reports", featureKey: 'reports' },
  { id: "more", label: "More", icon: MoreHorizontal, path: "/more" },
];

export const BottomNavigation = ({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { features } = useWorkspace();

  // Filter nav items based on enabled features
  const navItems = allNavItems.filter(item => {
    // Always show items without a featureKey (dashboard, more)
    if (!item.featureKey) return true;
    // Show item only if its feature is enabled
    return features.pages[item.featureKey];
  });

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
