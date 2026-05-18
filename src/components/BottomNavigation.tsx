// [CMP-2b9e7d] BottomNavigation — bottom navigation component
import { Home, ClipboardList, Map, Package, User, Clipboard, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents, ProjectComponentFlags } from "@/hooks/useProjectComponents";

interface BottomNavigationProps {
  currentPage: string;
  currentTeamType?: string | null;
}

type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  componentKey?: keyof ProjectComponentFlags;
  alwaysShow?: boolean;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "reports", label: "Reports", icon: Clipboard, path: "/reports", componentKey: "enable_reports" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys", componentKey: "enable_take_surveys" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes", componentKey: "enable_routes" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory", componentKey: "enable_inventory" },
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/support-ticket", alwaysShow: true },
  { id: "profile", label: "Profile", icon: User, path: "/profile" },
];

export const BottomNavigation = ({ currentPage, currentTeamType }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { isInitialized, currentProjectId } = useWorkspace();
  const { flags, isLoaded } = useProjectComponents(currentProjectId);

  const filteredNavItems = useMemo(() => {
    // While workspace/components load, show only dashboard, chat, profile
    if (!isInitialized || !isLoaded) {
      return navItems.filter(
        (item) => item.id === "dashboard" || item.id === "profile" || item.alwaysShow
      );
    }

    return navItems.filter((item) => {
      if (item.alwaysShow) return true;
      if (!item.componentKey) return true;

      // Project-level toggle is the source of truth
      if (!flags[item.componentKey]) return false;

      // Team-type fallbacks (kept to preserve existing behavior)
      const teamType = currentTeamType?.toLowerCase();
      if (teamType === "wholesale" && (item.id === "reports" || item.id === "inventory")) return false;
      if (["seeding", "market_research"].includes(teamType ?? "") && item.id === "reports") return false;
      if (teamType === "sampling" && (item.id === "reports" || item.id === "surveys" || item.id === "inventory")) return false;
      if (["survey", "survey_campaign"].includes(teamType ?? "") && (item.id === "inventory" || item.id === "reports")) return false;
      if (teamType === "instore" && (item.id === "surveys" || item.id === "inventory" || item.id === "routes")) return false;

      return true;
    });
  }, [currentTeamType, isInitialized, isLoaded, flags]);

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

