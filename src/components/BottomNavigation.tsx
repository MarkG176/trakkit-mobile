// [CMP-2b9e7d] BottomNavigation — agent bottom nav, gated by CRM-XXXX active_components codes
import { Home, ClipboardList, Map, Package, User, Clipboard, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useProjectComponents } from "@/hooks/useProjectComponents";

interface BottomNavigationProps {
  currentPage: string;
}

type NavItem = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  /** CRM code from mobileComponentsCatalog. Item is hidden when disabled. */
  code?: string;
  alwaysShow?: boolean;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/", code: "CRM-0089", alwaysShow: true },
  { id: "reports", label: "Reports", icon: Clipboard, path: "/reports", code: "CRM-0099" },
  { id: "surveys", label: "Surveys", icon: ClipboardList, path: "/surveys", code: "CRM-0097" },
  { id: "routes", label: "Routes", icon: Map, path: "/routes", code: "CRM-0098" },
  { id: "inventory", label: "Inventory", icon: Package, path: "/inventory", code: "CRM-0093" },
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/support-ticket", alwaysShow: true },
  { id: "profile", label: "Profile", icon: User, path: "/profile", alwaysShow: true },
];

export const BottomNavigation = ({ currentPage }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const { isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();

  const filteredNavItems = useMemo(() => {
    // While workspace/components load, show only always-visible tabs.
    if (!isInitialized || !isLoaded) {
      return navItems.filter((item) => item.alwaysShow);
    }

    return navItems.filter((item) => {
      if (item.alwaysShow) return true;
      if (!item.code) return true;
      return isEnabled(item.code);
    });
  }, [isInitialized, isLoaded, isEnabled]);

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
