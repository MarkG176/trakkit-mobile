import { Home, ClipboardList, Map, Package, User, Clipboard, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";

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
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/support-ticket", alwaysShow: true },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export const BottomNavigation = ({ currentPage, currentTeamType }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { isInitialized } = useWorkspace();

  // Filter nav items based on team type
  const filteredNavItems = useMemo(() => {
    // If workspace not initialized yet, show only dashboard, chat, and profile
    if (!isInitialized) {
      return navItems.filter(item => 
        item.id === 'dashboard' || item.id === 'profile' || (item as any).alwaysShow
      );
    }

    return navItems.filter(item => {
      // Chat is always visible
      if ((item as any).alwaysShow) return true;
      const teamType = currentTeamType?.toLowerCase();
      if (teamType === 'wholesale' && (item.id === 'reports' || item.id === 'inventory')) {
        return false;
      }
      if (['seeding', 'market_research'].includes(teamType) && (item.id === 'reports' || item.id === 'surveys')) {
        return false;
      }
      if (teamType === 'sampling' && (item.id === 'reports' || item.id === 'surveys' || item.id === 'inventory')) {
        return false;
      }
      if (['survey', 'survey_campaign'].includes(teamType ?? '') && (item.id === 'inventory' || item.id === 'reports')) {
        return false;
      }
      if (teamType === 'instore' && (item.id === 'surveys' || item.id === 'inventory')) {
        return false;
      }
      return true;
    });
  }, [currentTeamType, isInitialized]);

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
